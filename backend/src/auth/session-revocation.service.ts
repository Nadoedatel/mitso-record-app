import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache';

/** Access tokens live 15 minutes (see AuthService.generateTokens); a revocation mark only has to outlive that */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * Makes logout and detected token theft take effect on access tokens right away.
 * Every token carries `sid` (the login's family id); revoking a family writes a short-lived mark
 * that JwtStrategy checks on each request. Without it a stolen access token would keep working
 * until it expires on its own. If the cache store is down the mark is not written or read:
 * the access token then dies by expiry (at most 15 minutes), the refresh token is revoked anyway.
 */
@Injectable()
export class SessionRevocationService {
  constructor(private readonly cache: CacheService) {}

  async revoke(sid: string): Promise<void> {
    await this.cache.put(this.key(sid), '1', ACCESS_TOKEN_TTL_SECONDS + 60);
  }

  async isRevoked(sid: string): Promise<boolean> {
    return (await this.cache.peek(this.key(sid))) !== null;
  }

  private key(sid: string): string {
    return `revoked-sid:${sid}`;
  }
}
