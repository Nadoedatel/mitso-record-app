import { Global, Logger, Module } from '@nestjs/common';
import { AuthUserCache } from './auth-user.cache';
import { CACHE_STORE, CacheStore } from './cache-store';
import { CacheService } from './cache.service';
import { MemoryCacheStore } from './memory-cache.store';
import { RedisCacheStore } from './redis-cache.store';

/**
 * Picks the backend: Redis when REDIS_URL is set, otherwise memory.
 * The app works either way, Redis only adds sharing between instances and survival across restarts.
 */
export function createCacheStore(env: NodeJS.ProcessEnv = process.env): CacheStore {
  if (env.REDIS_URL) {
    new Logger('CacheModule').log('Cache backend: Redis');
    return new RedisCacheStore(env.REDIS_URL);
  }
  return new MemoryCacheStore();
}

/** CacheModule - global module providing CacheService to every feature module */
@Global()
@Module({
  providers: [{ provide: CACHE_STORE, useFactory: () => createCacheStore() }, CacheService, AuthUserCache],
  exports: [CacheService, AuthUserCache],
})
export class CacheModule {}
