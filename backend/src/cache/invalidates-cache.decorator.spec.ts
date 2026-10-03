import { CacheService } from './cache.service';
import { INVALIDATES_CACHE, InvalidatesCache } from './invalidates-cache.decorator';

describe('@InvalidatesCache', () => {
  const invalidate = jest.fn();

  class Sample {
    cache = { invalidate } as unknown as CacheService;
    events: string[] = [];

    @InvalidatesCache('ns')
    async write(value: number) {
      this.events.push('write');
      return value * 2;
    }

    @InvalidatesCache('ns')
    async failing() {
      throw new Error('db error');
    }
  }

  beforeEach(() => {
    invalidate.mockReset().mockImplementation(async () => undefined);
  });

  it('passes arguments and the result through and invalidates afterwards', async () => {
    const sample = new Sample();
    invalidate.mockImplementation(async () => void sample.events.push('invalidate'));

    expect(await sample.write(21)).toBe(42);

    expect(sample.events).toEqual(['write', 'invalidate']); // after the write, never before
    expect(invalidate).toHaveBeenCalledWith('ns');
  });

  it('still invalidates when the method throws, and rethrows the original error', async () => {
    await expect(new Sample().failing()).rejects.toThrow('db error');

    expect(invalidate).toHaveBeenCalledWith('ns');
  });

  it('marks the method so wiring can be checked', () => {
    expect(Reflect.getMetadata(INVALIDATES_CACHE, Sample.prototype.write)).toBe('ns');
  });
});
