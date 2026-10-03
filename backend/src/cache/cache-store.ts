/** Injection token for the active cache backend */
export const CACHE_STORE = Symbol('CACHE_STORE');

/**
 * Minimal key-value backend the cache needs. Values are strings (the service serializes JSON),
 * so the in-memory and Redis implementations behave the same.
 */
export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /** Atomically increment a counter (missing counts as 0) and return the new value */
  incr(key: string): Promise<number>;
  /** Like incr, but the counter expires `ttlSeconds` after its first increment (fixed window) */
  incrWithTtl(key: string, ttlSeconds: number): Promise<number>;
  del(key: string): Promise<void>;
  /** Remove everything this app stored (used by tests) */
  clear(): Promise<void>;
  close(): Promise<void>;
}
