import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_STORE, CacheStore } from './cache-store';

/**
 * Cache-aside with namespace versioning.
 *
 * Reading: look in the cache; on a miss run the loader (the database query) and store the result.
 * Invalidating: instead of hunting down every key of a namespace ("faculties list page 2 search ИТ"...),
 * a per-namespace version number is bumped, and the version is part of every key. Old keys are
 * never read again and expire on their own. One cheap INCR replaces a scan-and-delete.
 *
 * The cache is an optimization, never a dependency: any store failure degrades to "ask the database".
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  /** Concurrent misses for one key share a single loader call (prevents a stampede on the database) */
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(@Inject(CACHE_STORE) private readonly store: CacheStore) {}

  /**
   * Returns the cached value, or computes it with `loader` and caches it for `ttlSeconds`.
   * Values are stored as JSON, so a cached value comes back as plain JSON data
   * (a Date is a string), which is exactly what an HTTP response would contain anyway.
   * An exception from the loader is propagated and never cached.
   */
  async getOrSet<T>(namespace: string, key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const version = await this.version(namespace);
    const fullKey = `${namespace}:v${version}:${key}`;

    const hit = await this.safely(() => this.store.get(fullKey));
    if (hit !== null && hit !== undefined) {
      return JSON.parse(hit) as T;
    }

    const pending = this.inflight.get(fullKey);
    if (pending) return pending as Promise<T>;

    const load = (async () => {
      try {
        const value = await loader();
        await this.safely(() => this.store.set(fullKey, JSON.stringify(value), ttlSeconds));
        return value;
      } finally {
        this.inflight.delete(fullKey);
      }
    })();
    this.inflight.set(fullKey, load);
    return load;
  }

  /** Make everything cached under `namespace` unreadable (bumps its version) */
  async invalidate(namespace: string): Promise<void> {
    await this.safely(() => this.store.incr(`ver:${namespace}`));
  }

  /**
   * Raw key-value helpers for short-lived state that is not a cache of the database (login
   * attempt counters, lockouts). Like everything here they fail soft: a store outage is
   * logged and the call behaves as "nothing stored" (null / 0).
   */
  async count(key: string, windowSeconds: number): Promise<number> {
    return (await this.safely(() => this.store.incrWithTtl(`raw:${key}`, windowSeconds))) ?? 0;
  }

  async peek(key: string): Promise<string | null> {
    return this.safely(() => this.store.get(`raw:${key}`));
  }

  async put(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.safely(() => this.store.set(`raw:${key}`, value, ttlSeconds));
  }

  async forget(key: string): Promise<void> {
    await this.safely(() => this.store.del(`raw:${key}`));
  }

  /** Drop everything (tests) */
  async clear(): Promise<void> {
    await this.safely(() => this.store.clear());
  }

  private async version(namespace: string): Promise<string> {
    const raw = await this.safely(() => this.store.get(`ver:${namespace}`));
    return raw ?? '0';
  }

  /** Run a store call; on failure log and return null so the caller behaves as on a cache miss */
  private async safely<R>(call: () => Promise<R>): Promise<R | null> {
    try {
      return await call();
    } catch (error) {
      this.logger.warn(`Cache unavailable, using the database: ${(error as Error).message}`);
      return null;
    }
  }
}

/**
 * Builds a stable cache key part from a query object: the same filters in any property order
 * give the same key, and undefined values are ignored.
 */
export function stableKey(query: object): string {
  const entries = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}
