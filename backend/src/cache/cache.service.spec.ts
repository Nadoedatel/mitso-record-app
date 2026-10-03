import { CacheService, stableKey } from './cache.service';
import { CacheStore } from './cache-store';
import { MemoryCacheStore } from './memory-cache.store';

describe('CacheService', () => {
  let store: MemoryCacheStore;
  let cache: CacheService;

  beforeEach(() => {
    store = new MemoryCacheStore();
    cache = new CacheService(store);
  });

  describe('getOrSet', () => {
    it('runs the loader once and serves later reads from the cache', async () => {
      const loader = jest.fn().mockResolvedValue({ id: 1, name: 'ФИТ' });

      const first = await cache.getOrSet('ns', 'k', 60, loader);
      const second = await cache.getOrSet('ns', 'k', 60, loader);

      expect(loader).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it('keeps different keys and namespaces apart', async () => {
      const a = await cache.getOrSet('ns', 'a', 60, async () => 'A');
      const b = await cache.getOrSet('ns', 'b', 60, async () => 'B');
      const other = await cache.getOrSet('other', 'a', 60, async () => 'X');

      expect([a, b, other]).toEqual(['A', 'B', 'X']);
    });

    it('returns cached values as plain JSON (a Date becomes a string, like in an HTTP response)', async () => {
      const loader = async () => ({ at: new Date('2026-01-01T00:00:00.000Z') });
      await cache.getOrSet('ns', 'k', 60, loader);

      const cached = await cache.getOrSet('ns', 'k', 60, loader);

      expect(cached).toEqual({ at: '2026-01-01T00:00:00.000Z' });
    });

    it('caches falsy values too (0, empty list) instead of treating them as a miss', async () => {
      const loader = jest.fn().mockResolvedValue([]);

      await cache.getOrSet('ns', 'k', 60, loader);
      await cache.getOrSet('ns', 'k', 60, loader);

      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('does not cache a loader error and lets it through', async () => {
      const loader = jest.fn().mockRejectedValueOnce(new Error('not found')).mockResolvedValueOnce('ok');

      await expect(cache.getOrSet('ns', 'k', 60, loader)).rejects.toThrow('not found');
      expect(await cache.getOrSet('ns', 'k', 60, loader)).toBe('ok');
    });

    it('shares one loader call between concurrent misses (no stampede)', async () => {
      let release: (value: string) => void = () => undefined;
      const loader = jest.fn(() => new Promise<string>((resolve) => (release = resolve)));

      const all = Promise.all([
        cache.getOrSet('ns', 'k', 60, loader),
        cache.getOrSet('ns', 'k', 60, loader),
        cache.getOrSet('ns', 'k', 60, loader),
      ]);
      await new Promise((r) => setImmediate(r));
      release('value');

      expect(await all).toEqual(['value', 'value', 'value']);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('expires entries after the TTL', async () => {
      const now = jest.spyOn(Date, 'now');
      now.mockReturnValue(1_000_000);
      const loader = jest.fn().mockResolvedValue('v');
      await cache.getOrSet('ns', 'k', 60, loader);

      now.mockReturnValue(1_000_000 + 59_000);
      await cache.getOrSet('ns', 'k', 60, loader);
      expect(loader).toHaveBeenCalledTimes(1);

      now.mockReturnValue(1_000_000 + 61_000);
      await cache.getOrSet('ns', 'k', 60, loader);
      expect(loader).toHaveBeenCalledTimes(2);
      now.mockRestore();
    });
  });

  describe('invalidate', () => {
    it('makes the namespace re-read from the source', async () => {
      let value = 'old';
      const loader = async () => value;
      expect(await cache.getOrSet('ns', 'k', 60, loader)).toBe('old');

      value = 'new';
      expect(await cache.getOrSet('ns', 'k', 60, loader)).toBe('old'); // still cached

      await cache.invalidate('ns');
      expect(await cache.getOrSet('ns', 'k', 60, loader)).toBe('new');
    });

    it('invalidates every key of the namespace but not other namespaces', async () => {
      const loaderA = jest.fn().mockResolvedValue('A');
      const loaderB = jest.fn().mockResolvedValue('B');
      const loaderOther = jest.fn().mockResolvedValue('O');
      await cache.getOrSet('ns', 'a', 60, loaderA);
      await cache.getOrSet('ns', 'b', 60, loaderB);
      await cache.getOrSet('other', 'a', 60, loaderOther);

      await cache.invalidate('ns');
      await cache.getOrSet('ns', 'a', 60, loaderA);
      await cache.getOrSet('ns', 'b', 60, loaderB);
      await cache.getOrSet('other', 'a', 60, loaderOther);

      expect(loaderA).toHaveBeenCalledTimes(2);
      expect(loaderB).toHaveBeenCalledTimes(2);
      expect(loaderOther).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the store is down', () => {
    const brokenStore: CacheStore = {
      get: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      incr: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      incrWithTtl: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      del: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      clear: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      close: jest.fn(),
    };

    it('falls back to the loader instead of failing the request', async () => {
      const broken = new CacheService(brokenStore);

      expect(await broken.getOrSet('ns', 'k', 60, async () => 'from db')).toBe('from db');
    });

    it('does not throw on invalidate or clear', async () => {
      const broken = new CacheService(brokenStore);

      await expect(broken.invalidate('ns')).resolves.toBeUndefined();
      await expect(broken.clear()).resolves.toBeUndefined();
    });
  });
});

describe('stableKey', () => {
  it('ignores property order and undefined values', () => {
    expect(stableKey({ page: 2, search: 'ИТ' })).toBe(stableKey({ search: 'ИТ', page: 2, limit: undefined }));
  });

  it('gives different keys for different filters', () => {
    expect(stableKey({ page: 1 })).not.toBe(stableKey({ page: 2 }));
    expect(stableKey({})).not.toBe(stableKey({ page: 1 }));
  });
});
