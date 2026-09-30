import { CacheStore } from './cache-store';

interface Entry {
  value: string;
  expiresAt: number;
}

/**
 * In-process cache. Zero infrastructure, but every instance has its own copy and a restart
 * empties it. Used when REDIS_URL is not set (local dev, tests, single-instance deployments).
 */
export class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();
  private readonly counters = new Map<string, number>();

  constructor(private readonly maxEntries = 1000) {}

  async get(key: string): Promise<string | null> {
    // Counters share the keyspace with values, like INCR and GET do in Redis
    const counter = this.counters.get(key);
    if (counter !== undefined) return String(counter);
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    // Map keeps insertion order: drop the oldest entries instead of growing without bound
    this.entries.delete(key);
    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async incr(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, next);
    return next;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.counters.clear();
  }

  async close(): Promise<void> {
    await this.clear();
  }
}
