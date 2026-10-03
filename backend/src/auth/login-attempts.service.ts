import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CacheService } from '../cache';

const MAX_FAILURES = 5;
const FAILURE_WINDOW_SECONDS = 15 * 60;
const BASE_LOCK_SECONDS = 30;
const MAX_LOCK_SECONDS = 15 * 60;

/**
 * Per-account brute-force protection. The IP throttler alone is bypassed by an attacker with many
 * IPs; this one counts failures per email, whoever sends them.
 *
 * After MAX_FAILURES failed logins inside the window the email is locked, and each further failure
 * doubles the lock (30 s, 60 s, ... up to 15 min). Unknown emails are counted and locked the same
 * way, so the lock itself does not reveal which accounts exist. Trade-off: anyone can lock a known
 * email for a few minutes; the cap keeps that a nuisance rather than an outage.
 * State lives in the cache store (Redis when configured); if it is down the check is skipped and
 * only the IP throttler remains.
 */
@Injectable()
export class LoginAttemptsService {
  constructor(private readonly cache: CacheService) {}

  /** Throws 429 while the email is locked */
  async assertNotLocked(email: string): Promise<void> {
    const until = Number(await this.cache.peek(this.lockKey(email)));
    const remaining = Math.ceil((until - Date.now()) / 1000);
    if (until && remaining > 0) {
      throw new HttpException(`Too many failed login attempts. Try again in ${remaining} s.`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async recordFailure(email: string): Promise<void> {
    const failures = await this.cache.count(this.failKey(email), FAILURE_WINDOW_SECONDS);
    if (failures < MAX_FAILURES) return;

    const lockSeconds = Math.min(BASE_LOCK_SECONDS * 2 ** (failures - MAX_FAILURES), MAX_LOCK_SECONDS);
    await this.cache.put(this.lockKey(email), String(Date.now() + lockSeconds * 1000), lockSeconds);
  }

  async recordSuccess(email: string): Promise<void> {
    await this.cache.forget(this.failKey(email));
    await this.cache.forget(this.lockKey(email));
  }

  private failKey(email: string): string {
    return `login-fail:${email.trim().toLowerCase()}`;
  }

  private lockKey(email: string): string {
    return `login-lock:${email.trim().toLowerCase()}`;
  }
}
