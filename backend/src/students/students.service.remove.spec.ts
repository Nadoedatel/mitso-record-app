import { AuthUserCache, CacheService } from '../cache';
import { NotFoundError } from '../common/errors';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { PrismaService } from '../prisma/prisma.service';
import { TeachersService } from '../teachers/teachers.service';
import { StudentsRepository } from './students.repository';
import { StudentsService } from './students.service';

/**
 * Deleting a student or teacher must delete the LOGIN ACCOUNT. The schema's `onDelete: Cascade`
 * runs from user to profile, not the other way round, so removing only the profile row used to
 * leave a user who could still sign in.
 * Students go through their repository, teachers still straight through Prisma, hence two ways to build them.
 */
describe.each([
  [
    'student',
    (db: { profile: jest.Mock; deleteAccount: jest.Mock }, authUsers: unknown) =>
      new StudentsService(
        { findById: db.profile, deleteAccount: db.deleteAccount } as unknown as StudentsRepository,
        new CacheService(new MemoryCacheStore()),
        authUsers as AuthUserCache,
      ),
  ],
  [
    'teacher',
    (db: { profile: jest.Mock; deleteAccount: jest.Mock }, authUsers: unknown) =>
      new TeachersService(
        {
          teacher: { findUnique: db.profile, delete: jest.fn() },
          user: { delete: ({ where }: { where: { id: number } }) => db.deleteAccount(where.id) },
        } as unknown as PrismaService,
        new CacheService(new MemoryCacheStore()),
        authUsers as AuthUserCache,
      ),
  ],
] as const)('remove %s', (_label, build) => {
  const db = { profile: jest.fn(), deleteAccount: jest.fn() };
  const authUsers = { invalidate: jest.fn() };
  const service = build(db, authUsers);

  beforeEach(() => {
    jest.resetAllMocks();
    db.profile.mockResolvedValue({ id: 3, userId: 42 });
    db.deleteAccount.mockResolvedValue(undefined);
  });

  it('deletes the user account (the cascade removes the profile) and never just the profile row', async () => {
    await service.remove(3);

    expect(db.deleteAccount).toHaveBeenCalledWith(42);
  });

  it('drops the cached auth entry so a still-valid access token stops working at once', async () => {
    await service.remove(3);

    expect(authUsers.invalidate).toHaveBeenCalledWith(42);
  });

  it('touches nothing when the profile does not exist', async () => {
    db.profile.mockResolvedValue(null);

    await expect(service.remove(3)).rejects.toBeInstanceOf(NotFoundError);

    expect(db.deleteAccount).not.toHaveBeenCalled();
    expect(authUsers.invalidate).not.toHaveBeenCalled();
  });
});
