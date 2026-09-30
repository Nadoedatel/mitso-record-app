import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUserCache } from '../../cache';
import { JWT_ALGORITHM } from '../jwt-secrets';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JwtStrategy - validates JWT tokens and loads user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authUsers: AuthUserCache) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: [JWT_ALGORITHM],
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  /**
   * Resolve the token's user. The row comes from a short-lived cache (see AuthUserCache),
   * so a deleted user is rejected as soon as the cache entry is invalidated.
   */
  async validate(payload: JwtPayload) {
    const user = await this.authUsers.get(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
