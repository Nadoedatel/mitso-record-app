import { CacheService } from '../cache';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from './groups.service';

describe('GroupsService.findAll', () => {
  const prisma = { group: { findMany: jest.fn(), count: jest.fn() } };
  const service = new GroupsService(prisma as unknown as PrismaService, new CacheService(new MemoryCacheStore()));

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.group.count.mockResolvedValue(2);
    prisma.group.findMany.mockResolvedValue([
      { id: 1, name: 'A', course: 1, _count: { students: 30 }, subjectGroups: [] },
      { id: 2, name: 'B', course: 2, _count: { students: 0 }, subjectGroups: [] },
    ]);
  });

  it('asks for a student COUNT per group, not the students themselves', async () => {
    await service.findAll({});

    const { include } = prisma.group.findMany.mock.calls[0][0];
    expect(include._count).toEqual({ select: { students: true } });
    expect(include.students).toBeUndefined();
  });

  it('returns studentCount on every group (what the admin table reads) and hides the Prisma _count', async () => {
    const { data } = await service.findAll({});

    expect(data.map((g) => [g.id, g.studentCount])).toEqual([
      [1, 30],
      [2, 0],
    ]);
    expect(data[0]).not.toHaveProperty('_count');
    expect(data[0]).not.toHaveProperty('students');
  });
});
