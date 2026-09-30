import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Creates an ioredis client that FAILS FAST when Redis is down.
 *
 * By default ioredis queues commands while disconnected and retries each up to 20 times, so a request
 * waits (possibly for many seconds) until Redis returns. For a cache and a rate limiter that is worse than
 * having no Redis: here there is no offline queue and one retry per command, so a command fails in
 * milliseconds and the caller falls back to the database or to in-memory counting.
 * The client keeps reconnecting in the background.
 */
export function createRedisClient(url: string, logger: Logger): Redis {
  let lastErrorAt = 0;

  const redis = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    // Reconnect in the background, waiting longer each time (max 10 s)
    retryStrategy: (attempt) => Math.min(attempt * 500, 10_000),
  });

  // Without a listener an 'error' event would crash the process. Log at most once a minute.
  redis.on('error', (error: Error) => {
    if (Date.now() - lastErrorAt > 60_000) {
      lastErrorAt = Date.now();
      logger.warn(`Redis error, falling back: ${error.message}`);
    }
  });
  redis.connect().catch(() => undefined); // errors are reported by the listener above

  return redis;
}
