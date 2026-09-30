import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ResilientThrottlerStorage } from './resilient-throttler.storage';

describe('ResilientThrottlerStorage', () => {
  const record = (totalHits: number) => ({ totalHits, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 });
  const args = ['ip', 60_000, 10, 60_000, 'default'] as const;
  let primary: { increment: jest.Mock };
  let fallback: { increment: jest.Mock };
  let storage: ResilientThrottlerStorage;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    primary = { increment: jest.fn().mockResolvedValue(record(1)) };
    fallback = { increment: jest.fn().mockResolvedValue(record(99)) };
    storage = new ResilientThrottlerStorage(primary as ThrottlerStorage, fallback as ThrottlerStorage, 10_000);
  });

  afterEach(() => jest.restoreAllMocks());

  it('uses the shared store while it works', async () => {
    expect(await storage.increment(...args)).toEqual(record(1));

    expect(primary.increment).toHaveBeenCalledWith(...args);
    expect(fallback.increment).not.toHaveBeenCalled();
  });

  it('falls back to memory counting instead of failing the request when the shared store throws', async () => {
    primary.increment.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(await storage.increment(...args)).toEqual(record(99));
  });

  it('skips the broken store for a while (circuit breaker) instead of paying a failed call per request', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    primary.increment.mockRejectedValue(new Error('down'));

    await storage.increment(...args);
    now.mockReturnValue(1_000_000 + 5_000);
    await storage.increment(...args);
    await storage.increment(...args);

    expect(primary.increment).toHaveBeenCalledTimes(1);
    expect(fallback.increment).toHaveBeenCalledTimes(3);
  });

  it('tries the shared store again after the pause and returns to it once it recovers', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    primary.increment.mockRejectedValueOnce(new Error('down'));
    await storage.increment(...args);

    now.mockReturnValue(1_000_000 + 10_001);

    expect(await storage.increment(...args)).toEqual(record(1)); // primary answered again
    expect(primary.increment).toHaveBeenCalledTimes(2);
  });

  it('warns once per outage, not once per request', async () => {
    primary.increment.mockRejectedValue(new Error('down'));

    await storage.increment(...args);
    await storage.increment(...args);
    await storage.increment(...args);

    expect(Logger.prototype.warn).toHaveBeenCalledTimes(1);
  });

  it('forwards shutdown hooks to the storages that have them', () => {
    const onApplicationShutdown = jest.fn();
    const onModuleDestroy = jest.fn();
    const release = jest.fn();
    const closing = new ResilientThrottlerStorage(
      { ...primary, onModuleDestroy } as unknown as ThrottlerStorage,
      { ...fallback, onApplicationShutdown } as unknown as ThrottlerStorage,
      undefined,
      release,
    );

    closing.onModuleDestroy();
    closing.onApplicationShutdown();

    expect(onModuleDestroy).toHaveBeenCalled();
    expect(onApplicationShutdown).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });
});
