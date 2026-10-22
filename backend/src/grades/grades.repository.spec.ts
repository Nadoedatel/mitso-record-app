import { GradeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GradeData, GradesRepository } from './grades.repository';

/** The queries themselves: what shape they ask the database for. The rules are in grades.service.spec.ts. */
describe('GradesRepository', () => {
  const prisma = {
    $transaction: jest.fn(),
    grade: { upsert: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    subjectGroup: { findMany: jest.fn() },
    teacherSubject: { findMany: jest.fn() },
  };
  const repo = new GradesRepository(prisma as unknown as PrismaService);

  const data: GradeData = {
    studentId: 7,
    subjectId: 9,
    gradeValue: 8,
    gradeType: GradeType.EXAM,
    examDate: null,
    notes: 'n',
    teacherId: 20,
  };

  beforeEach(() => jest.resetAllMocks());

  it('upserts by the student + subject + type key, and keeps the teacher on update', async () => {
    await repo.upsert(data);

    const args = prisma.grade.upsert.mock.calls[0][0];
    expect(args.where).toEqual({ studentId_subjectId_gradeType: { studentId: 7, subjectId: 9, gradeType: GradeType.EXAM } });
    expect(args.create).toEqual(data);
    expect(Object.keys(args.update).sort()).toEqual(['examDate', 'gradeValue', 'notes']); // no teacherId
  });

  it('runs a query inside a transaction when given its client, and on the normal connection otherwise', async () => {
    const tx = { grade: { upsert: jest.fn() } };

    await repo.upsert(data, tx as never);

    expect(tx.grade.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.grade.upsert).not.toHaveBeenCalled();
  });

  it('passes a custom transaction timeout to Prisma, and none by default', async () => {
    const work = jest.fn();
    await repo.transaction(work, { timeoutMs: 30_000 });
    await repo.transaction(work);

    expect(prisma.$transaction).toHaveBeenNthCalledWith(1, work, { timeout: 30_000 });
    expect(prisma.$transaction).toHaveBeenNthCalledWith(2, work, undefined);
  });

  it('looks up all the given grade keys with one query', async () => {
    prisma.grade.findMany.mockResolvedValue([]);

    await repo.findByKeys([
      { studentId: 1, subjectId: 5, gradeType: GradeType.EXAM },
      { studentId: 2, subjectId: 5, gradeType: GradeType.LAB },
    ]);

    expect(prisma.grade.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.grade.findMany.mock.calls[0][0].where.OR).toHaveLength(2);
  });

  it('asks which subjects a teacher owns with one IN query', async () => {
    prisma.teacherSubject.findMany.mockResolvedValue([{ subjectId: 5 }, { subjectId: 6 }]);

    expect(await repo.findAssignedSubjectIds(20, [5, 6, 7])).toEqual([5, 6]);
    expect(prisma.teacherSubject.findMany.mock.calls[0][0].where).toEqual({ teacherId: 20, subjectId: { in: [5, 6, 7] } });
  });

  it('counts the students of a group in the database instead of loading every student to count them', async () => {
    prisma.subjectGroup.findMany.mockResolvedValue([]);

    await repo.findGroupsOfSubject(5);

    const { include } = prisma.subjectGroup.findMany.mock.calls[0][0];
    expect(include.group.include._count).toEqual({ select: { students: true } });
    expect(include.group.include.students).toBeUndefined();
  });

  it('pages grades newest exam first and returns the total from a separate count', async () => {
    prisma.grade.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.grade.count.mockResolvedValue(41);

    const result = await repo.findPage({ studentId: 5 }, 3, 20);

    expect(prisma.grade.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { examDate: 'desc' }, skip: 40, take: 20 }));
    expect(result).toEqual({ data: [{ id: 1 }], total: 41 });
  });
});
