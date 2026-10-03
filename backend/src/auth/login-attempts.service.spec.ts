import { HttpException } from '@nestjs/common';
import { CacheService } from '../cache';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { LoginAttemptsService } from './login-attempts.service';

describe('LoginAttemptsService', () => {
  let attempts: LoginAttemptsService;
  const email = 'student@mitso.by';

  const fail = async (times: number, who = email) => {
    for (let i = 0; i < times; i++) await attempts.recordFailure(who);
  };
  const isLocked = () => attempts.assertNotLocked(email).then(() => false, (e: HttpException) => e.getStatus() === 429);

  beforeEach(() => {
    attempts = new LoginAttemptsService(new CacheService(new MemoryCacheStore()));
  });

  afterEach(() => jest.restoreAllMocks());

  it('allows 4 failures, locks on the 5th', async () => {
    await fail(4);
    expect(await isLocked()).toBe(false);

    await fail(1);
    expect(await isLocked()).toBe(true);
  });

  it('does not lock other emails and ignores case and spaces of the same email', async () => {
    await fail(5, ' Student@MITSO.by ');

    expect(await isLocked()).toBe(true);
    await expect(attempts.assertNotLocked('other@mitso.by')).resolves.toBeUndefined();
  });

  it('unlocks after the lock expires', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    await fail(5);
    expect(await isLocked()).toBe(true);

    now.mockReturnValue(1_000_000 + 31_000);

    expect(await isLocked()).toBe(false);
  });

  it('doubles the lock with every further failure, capped at 15 minutes', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    await fail(6); // 30 s * 2

    now.mockReturnValue(1_000_000 + 45_000);
    expect(await isLocked()).toBe(true);
    now.mockReturnValue(1_000_000 + 61_000);
    expect(await isLocked()).toBe(false);

    await fail(20);
    const error = await attempts.assertNotLocked(email).catch((e: HttpException) => e);
    expect((error as HttpException).message).toMatch(/Try again in (9\d\d|900) s/);
  });

  it('a successful login clears failures and lock', async () => {
    await fail(5);

    await attempts.recordSuccess(email);

    expect(await isLocked()).toBe(false);
    await fail(4);
    expect(await isLocked()).toBe(false);
  });

  it('does nothing (fails open) when the store is down', async () => {
    const down = new CacheService({
      get: jest.fn().mockRejectedValue(new Error('down')),
      set: jest.fn().mockRejectedValue(new Error('down')),
      incr: jest.fn(),
      incrWithTtl: jest.fn().mockRejectedValue(new Error('down')),
      del: jest.fn().mockRejectedValue(new Error('down')),
      clear: jest.fn(),
      close: jest.fn(),
    });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const resilient = new LoginAttemptsService(down);

    await resilient.recordFailure(email);
    await expect(resilient.assertNotLocked(email)).resolves.toBeUndefined();
  });
});
