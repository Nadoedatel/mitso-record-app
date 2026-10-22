import type { ConnectionOptions } from 'bullmq';

/**
 * Turns REDIS_URL into BullMQ connection options.
 * BullMQ opens several connections itself (blocking ones for workers), so it takes options, not a shared client.
 * `maxRetriesPerRequest: null` is required for workers: a blocking command must wait for Redis instead of failing.
 */
export function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  const db = parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : undefined;
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: Number.isInteger(db) ? db : undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}
