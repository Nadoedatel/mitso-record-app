/**
 * Parses TRUST_PROXY into Express' `trust proxy` setting.
 *
 * Behind a reverse proxy (Render, nginx) every request arrives from the proxy's IP, so the rate
 * limiter would count ALL users as one. Express can read the real client IP from X-Forwarded-For,
 * but only if told how many proxies to believe: trusting it blindly lets anyone send a fake header
 * and dodge the limit. So the default is off, and the value is a hop count ("1" on Render) or an
 * Express preset/subnet ("loopback", "10.0.0.0/8"). A bare "true" is refused: it trusts any sender.
 */
export function parseTrustProxy(raw: string | undefined): boolean | number | string {
  const value = raw?.trim();
  if (!value || value.toLowerCase() === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value.toLowerCase() === 'true') {
    throw new Error('TRUST_PROXY=true trusts every X-Forwarded-For header; use a hop count (e.g. 1) or a subnet');
  }
  return value;
}

/** Requests per minute per client for endpoints without their own limit */
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;

/**
 * Reads RATE_LIMIT_PER_MINUTE: the general rate limit, 60 unless set.
 * It exists for load tests (k6 from one IP would hit 429 at once) and must not be raised in production.
 * Login, refresh and the like keep their own stricter limits, this value does not touch them.
 * A value that is not a positive whole number is an error, so a typo cannot silently switch the limit off.
 */
export function parseRateLimit(raw: string | undefined): number {
  const value = raw?.trim();
  if (!value) return DEFAULT_RATE_LIMIT_PER_MINUTE;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`RATE_LIMIT_PER_MINUTE must be a positive whole number, got "${raw}"`);
  }
  return Number(value);
}

/** Origins allowed to call the API from a browser (FRONTEND_URL, comma separated). */
export function getAllowedOrigins(env: NodeJS.ProcessEnv): string[] {
  return (env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
