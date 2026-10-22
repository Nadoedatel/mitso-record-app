import { PrismaService } from '../prisma/prisma.service';
import { StudentsRepository } from './students.repository';

/** The queries themselves: what shape they ask the database for. The rules are in students.service.spec.ts. */
describe('StudentsRepository', () => {
  const tx = { user: { create: jest.fn() }, student: { create: jest.fn() } };
  const prisma = {
    $transaction: jest.fn(),
    user: { findUnique: jest.fn(), delete: jest.fn() },
    student: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
  };
  const repo = new StudentsRepository(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((work: (t: typeof tx) => unknown) => work(tx));
  });

  it('creates the account and the student in ONE transaction, linking them', async () => {
    tx.user.create.mockResolvedValue({ id: 42 });
    tx.student.create.mockResolvedValue({ id: 7 });

    await repo.createWithAccount({ email: 'a@mitso.by', passwordHash: 'hash' }, { firstName: 'Иван', lastName: 'Иванов', studentId: '1', course: 1, enrollmentYear: 2025 }, null);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.create.mock.calls[0][0].data).toEqual({ email: 'a@mitso.by', password: 'hash', role: 'STUDENT' });
    expect(tx.student.create.mock.calls[0][0].data).toMatchObject({ userId: 42, birthDate: null, firstName: 'Иван' });
  });

  it('searches every word in any of the four name columns, and filters by group', async () => {
    prisma.student.findMany.mockResolvedValue([]);
    prisma.student.count.mockResolvedValue(0);

    await repo.findPage({ search: 'Иванов Иван', groupId: 3 }, 2, 20);

    const { where, skip, take, orderBy } = prisma.student.findMany.mock.calls[0][0];
    expect(where.groupId).toBe(3);
    expect(where.AND).toHaveLength(2); // two words, each in any column
    expect(where.AND[0].OR.map((c: object) => Object.keys(c)[0])).toEqual(['firstName', 'lastName', 'middleName', 'studentId']);
    expect([skip, take, orderBy]).toEqual([20, 20, { lastName: 'asc' }]);
    expect(prisma.student.count).toHaveBeenCalledWith({ where }); // the total counts the same filter
  });

  it('does not filter at all for an empty search and no group', async () => {
    prisma.student.findMany.mockResolvedValue([]);
    prisma.student.count.mockResolvedValue(0);

    await repo.findPage({}, 1, 20);

    expect(prisma.student.findMany.mock.calls[0][0].where).toEqual({});
  });

  it('answers whether an email is taken', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);

    expect(await repo.emailTaken('a@mitso.by')).toBe(true);
    expect(await repo.emailTaken('b@mitso.by')).toBe(false);
  });

  it('deletes the ACCOUNT of a student, never only the profile row', async () => {
    await repo.deleteAccount(42);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 42 } });
  });
});
