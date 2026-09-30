import { CacheService } from '../cache';
import { MemoryCacheStore } from '../cache/memory-cache.store';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectsService } from './subjects.service';

describe('SubjectsService.findOne', () => {
  const prisma = { subject: { findUnique: jest.fn() } };
  const service = new SubjectsService(prisma as unknown as PrismaService, new CacheService(new MemoryCacheStore()));

  it('does not load the subject\'s grades (thousands of rows, loaded only to show the name)', async () => {
    prisma.subject.findUnique.mockResolvedValue({ id: 1, name: 'Math' });

    await service.findOne(1);

    const { include } = prisma.subject.findUnique.mock.calls[0][0];
    expect(Object.keys(include).sort()).toEqual(['subjectGroups', 'teacherSubjects']);
  });
});
