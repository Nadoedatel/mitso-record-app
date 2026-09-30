import { NotFoundException } from '@nestjs/common';
import { AuthUserCache, CacheService } from '../cache';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { PrismaService } from '../prisma/prisma.service';
import { TeachersService } from '../teachers/teachers.service';
import { StudentsService } from './students.service';

/**
 * Deleting a student or teacher must delete the LOGIN ACCOUNT. The schema's `onDelete: Cascade`
 * runs from user to profile, not the other way round, so removing only the profile row used to
 * leave a user who could still sign in.
 */
describe.each([
  ['student', 'student', (prisma: unknown, authUsers: unknown) => new StudentsService(prisma as PrismaService, new CacheService(new MemoryCacheStore()), authUsers as AuthUserCache)],
  ['teacher', 'teacher', (prisma: unknown, authUsers: unknown) => new TeachersService(prisma as PrismaService, new CacheService(new MemoryCacheStore()), authUsers as AuthUserCache)],
] as const)('remove %s', (_label, model, build) => {
  const prisma = {
    student: { findUnique: jest.fn(), delete: jest.fn() },
    teacher: { findUnique: jest.fn(), delete: jest.fn() },
    user: { delete: jest.fn() },
  };
  const authUsers = { invalidate: jest.fn() };
  const service = build(prisma, authUsers);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma[model].findUnique.mockResolvedValue({ id: 3, userId: 42 });
    prisma.user.delete.mockResolvedValue({ id: 42 });
  });

  it('deletes the user account (the cascade removes the profile) and never just the profile row', async () => {
    await service.remove(3);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(prisma[model].delete).not.toHaveBeenCalled();
  });

  it('drops the cached auth entry so a still-valid access token stops working at once', async () => {
    await service.remove(3);

    expect(authUsers.invalidate).toHaveBeenCalledWith(42);
  });

  it('touches nothing when the profile does not exist', async () => {
    prisma[model].findUnique.mockResolvedValue(null);

    await expect(service.remove(3)).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(authUsers.invalidate).not.toHaveBeenCalled();
  });
});
