import { Logger } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { createRedisClient } from '../cache/redis-client';
import { ResilientThrottlerStorage } from './resilient-throttler.storage';

/**
 * Chooses where rate-limit counters live.
 * REDIS_URL set: Redis, so the limit is shared by every instance and survives a restart
 * (with memory, two instances double the limit and a restart resets it), wrapped so a Redis
 * outage degrades to in-memory counting. Not set: undefined, which makes Throttler use its own memory storage.
 */
export function createThrottlerStorage(env: NodeJS.ProcessEnv = process.env): ThrottlerStorage | undefined {
  if (!env.REDIS_URL) return undefined;

  const redis = createRedisClient(env.REDIS_URL, new Logger('ThrottlerRedis'));
  // The library only closes connections it created itself, and this one is ours
  return new ResilientThrottlerStorage(
    new ThrottlerStorageRedisService(redis),
    new ThrottlerStorageService(),
    undefined,
    () => redis.disconnect(),
  );
}
