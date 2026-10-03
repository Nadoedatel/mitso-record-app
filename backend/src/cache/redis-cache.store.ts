import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheStore } from './cache-store';
import { createRedisClient } from './redis-client';

/**
 * Redis-backed cache shared by all app instances and surviving restarts.
 * Every key carries a prefix so the app can share a Redis with other software.
 * The client fails fast when Redis is down (see createRedisClient), and the cache service then
 * falls back to the database instead of hanging.
 */
export class RedisCacheStore implements CacheStore {
  private readonly logger = new Logger(RedisCacheStore.name);
  private readonly redis: Redis;

  constructor(url: string, private readonly prefix = 'mitso:') {
    this.redis = createRedisClient(url, this.logger);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(this.prefix + key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(this.prefix + key, value, 'EX', ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(this.prefix + key);
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.redis.incr(this.prefix + key);
    if (count === 1) await this.redis.expire(this.prefix + key, ttlSeconds);
    return count;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys: string[] = [];
    for await (const batch of this.redis.scanStream({ match: `${this.prefix}*`, count: 200 })) {
      keys.push(...(batch as string[]));
    }
    if (keys.length > 0) await this.redis.del(...keys);
  }

  async close(): Promise<void> {
    this.redis.disconnect();
  }

  /** Called by Nest on shutdown so the process can exit cleanly */
  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
