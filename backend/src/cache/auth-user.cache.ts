import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from './cache.service';

/**
 * How long a user row may be served from the cache.
 * This is the worst case for any missed invalidation: a deleted user stays "alive" for at most this long.
 */
export const AUTH_USER_TTL_SECONDS = 30;

/** Thrown inside the loader so that "user does not exist" is never cached */
class UserNotFound extends Error {}

/**
 * Caches the user row that JwtStrategy loads on EVERY authenticated request (the hottest query in the app).
 *
 * Unlike reference data, this cache guards access, so staleness is a security matter:
 * - each user has their own namespace (`user:<id>`), so changing one user costs one INCR, not the whole cache;
 * - only a user that EXISTS is cached, so a newly created account works at once;
 * - whoever deletes a user or changes their email or role MUST call `invalidate(userId)`
 *   (today: students.remove and teachers.remove). The TTL is only the backstop.
 */
@Injectable()
export class AuthUserCache {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /** The authenticated user for a token subject, or null if that user no longer exists */
  async get(userId: number): Promise<AuthUser | null> {
    try {
      return await this.cache.getOrSet(this.namespace(userId), 'auth', AUTH_USER_TTL_SECONDS, async () => {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UserNotFound();
        return { id: user.id, email: user.email, role: user.role } satisfies AuthUser;
      });
    } catch (error) {
      if (error instanceof UserNotFound) return null;
      throw error;
    }
  }

  /** Forget a user immediately: their next request reloads the row (or is rejected if it is gone) */
  async invalidate(userId: number): Promise<void> {
    await this.cache.invalidate(this.namespace(userId));
  }

  private namespace(userId: number): string {
    return `user:${userId}`;
  }
}
