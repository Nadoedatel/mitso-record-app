import 'reflect-metadata';
import { CacheService } from './cache.service';
import { DIRECTORY_NAMESPACE } from './cache.constants';

/** Metadata marker: lets tests check that a write method is wired to invalidate the cache */
export const INVALIDATES_CACHE = Symbol('INVALIDATES_CACHE');

/**
 * Marks a service method as a write: after it finishes the cache namespace is invalidated.
 * The service must have a `cache: CacheService` property.
 *
 * Invalidation runs AFTER the write (and also if it throws, in case it half-succeeded), so a reader
 * can never refill the cache with pre-write data after the bump, which a bump before the write allows.
 */
export function InvalidatesCache(namespace: string = DIRECTORY_NAMESPACE): MethodDecorator {
  return (_target, _key, descriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    const wrapped = async function (this: { cache: CacheService }, ...args: unknown[]) {
      try {
        return await original.apply(this, args);
      } finally {
        await this.cache.invalidate(namespace);
      }
    };
    Reflect.defineMetadata(INVALIDATES_CACHE, namespace, wrapped);
    descriptor.value = wrapped as unknown as typeof descriptor.value;
    return descriptor;
  };
}
