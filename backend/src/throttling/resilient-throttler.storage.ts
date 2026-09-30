import { Logger, OnApplicationShutdown, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';

type Increment = ThrottlerStorage['increment'];

/**
 * Rate-limit counters in a shared store (Redis) with a safety net.
 *
 * A rate limiter must not become an outage. If the shared store fails, the library's storage throws and
 * the guard turns EVERY request into a 500. Here a failure switches to the fallback (per-instance memory
 * counting, the behaviour before Redis): limits still apply, just per instance instead of globally.
 *
 * After a failure the primary is skipped for `retryAfterMs` (a circuit breaker), so a dead Redis
 * costs one failed call per period instead of one per request.
 */
export class ResilientThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown, OnModuleDestroy {
  private readonly logger = new Logger(ResilientThrottlerStorage.name);
  private skipPrimaryUntil = 0;

  constructor(
    private readonly primary: ThrottlerStorage,
    private readonly fallback: ThrottlerStorage,
    private readonly retryAfterMs = 10_000,
    /** Releases resources the storages do not own (e.g. the shared Redis connection) */
    private readonly release?: () => void,
  ) {}

  increment: Increment = async (key, ttl, limit, blockDuration, throttlerName) => {
    if (Date.now() >= this.skipPrimaryUntil) {
      try {
        return await this.primary.increment(key, ttl, limit, blockDuration, throttlerName);
      } catch (error) {
        this.skipPrimaryUntil = Date.now() + this.retryAfterMs;
        this.logger.warn(
          `Shared rate-limit store failed, counting in memory for ${this.retryAfterMs / 1000}s: ${(error as Error).message}`,
        );
      }
    }
    return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
  };

  onApplicationShutdown(): void {
    (this.fallback as Partial<OnApplicationShutdown>).onApplicationShutdown?.();
  }

  onModuleDestroy(): void {
    (this.primary as Partial<OnModuleDestroy>).onModuleDestroy?.();
    this.release?.();
  }
}
