import { CacheService } from './cache.service';
import { RedisCacheStore } from './redis-cache.store';

/**
 * Redis itself is not available in unit tests, but the failure mode is what matters most:
 * with Redis down, requests must be served from the database immediately, not hang.
 */
describe('RedisCacheStore with Redis unreachable', () => {
  let store: RedisCacheStore;
  let cache: CacheService;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    store = new RedisCacheStore('redis://127.0.0.1:1'); // nothing listens on port 1
    cache = new CacheService(store);
  });

  afterEach(async () => {
    await store.close();
    jest.restoreAllMocks();
  });

  it('fails fast instead of queueing commands until Redis returns', async () => {
    const started = Date.now();

    await expect(store.get('k')).rejects.toBeDefined();

    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('lets CacheService serve from the database, quickly', async () => {
    const started = Date.now();
    const loader = jest.fn().mockResolvedValue('from db');

    expect(await cache.getOrSet('ns', 'k', 60, loader)).toBe('from db');
    expect(await cache.getOrSet('ns', 'k', 60, loader)).toBe('from db');

    expect(loader).toHaveBeenCalledTimes(2); // nothing could be cached, but nothing broke
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
