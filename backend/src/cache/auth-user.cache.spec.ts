import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_USER_TTL_SECONDS, AuthUserCache } from './auth-user.cache';
import { CacheService } from './cache.service';
import { CacheStore } from './cache-store';
import { MemoryCacheStore } from './memory-cache.store';

describe('AuthUserCache', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const row = (id: number, role: Role = Role.STUDENT) => ({
    id,
    email: `u${id}@mitso.by`,
    role,
    password: 'hash',
    refreshToken: 'secret-hash',
  });
  let users: AuthUserCache;

  beforeEach(() => {
    jest.resetAllMocks();
    users = new AuthUserCache(prisma as unknown as PrismaService, new CacheService(new MemoryCacheStore()));
  });

  it('loads the user once and serves the next requests from the cache', async () => {
    prisma.user.findUnique.mockResolvedValue(row(1));

    await users.get(1);
    await users.get(1);

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('returns only what authorization needs, never the password hash or refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue(row(1, Role.TEACHER));

    const cached = await users.get(1);
    const again = await users.get(1);

    expect(again).toEqual({ id: 1, email: 'u1@mitso.by', role: 'TEACHER' });
    expect(JSON.stringify([cached, again])).not.toMatch(/hash|password|refresh/i);
  });

  it('returns null for a user that does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    expect(await users.get(404)).toBeNull();
  });

  it('never caches a missing user: an account created a moment later works at once', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(row(5));

    expect(await users.get(5)).toBeNull();
    expect(await users.get(5)).toMatchObject({ id: 5 });
  });

  it('forgets a user on invalidate, so a deleted user is rejected immediately', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(row(1)).mockResolvedValueOnce(null);
    expect(await users.get(1)).not.toBeNull(); // cached as alive

    await users.invalidate(1);

    expect(await users.get(1)).toBeNull();
  });

  it('invalidates one user without touching the others', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }) => row(where.id));
    await users.get(1);
    await users.get(2);
    prisma.user.findUnique.mockClear();

    await users.invalidate(1);
    await users.get(1);
    await users.get(2);

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('bounds the damage of a missed invalidation: the entry expires after the TTL', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    prisma.user.findUnique.mockResolvedValueOnce(row(1)).mockResolvedValueOnce(null);
    await users.get(1);

    now.mockReturnValue(1_000_000 + (AUTH_USER_TTL_SECONDS - 1) * 1000);
    expect(await users.get(1)).not.toBeNull(); // still the stale copy

    now.mockReturnValue(1_000_000 + (AUTH_USER_TTL_SECONDS + 1) * 1000);
    expect(await users.get(1)).toBeNull(); // backstop worked
    now.mockRestore();
  });

  it('keeps the TTL short (a missed invalidation must not last long)', () => {
    expect(AUTH_USER_TTL_SECONDS).toBeLessThanOrEqual(60);
  });

  it('asks the database on every request when the cache store is down', async () => {
    const broken: CacheStore = {
      get: jest.fn().mockRejectedValue(new Error('down')),
      set: jest.fn().mockRejectedValue(new Error('down')),
      incr: jest.fn().mockRejectedValue(new Error('down')),
      incrWithTtl: jest.fn().mockRejectedValue(new Error('down')),
      del: jest.fn().mockRejectedValue(new Error('down')),
      clear: jest.fn(),
      close: jest.fn(),
    };
    const degraded = new AuthUserCache(prisma as unknown as PrismaService, new CacheService(broken));
    prisma.user.findUnique.mockResolvedValue(row(1));

    expect(await degraded.get(1)).toMatchObject({ id: 1 });
    expect(await degraded.get(1)).toMatchObject({ id: 1 });
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
  });
});
