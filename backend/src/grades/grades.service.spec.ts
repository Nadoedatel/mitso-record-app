import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GradeType, Role } from '@prisma/client';
import { GradesService } from './grades.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateGradeDto } from './dto';

describe('GradesService', () => {
  const prisma = {
    teacher: { findUnique: jest.fn() },
    teacherSubject: { findFirst: jest.fn(), findMany: jest.fn() },
    subjectGroup: { findMany: jest.fn() },
    subject: { findMany: jest.fn(), findUnique: jest.fn() },
    student: { findMany: jest.fn() },
    grade: { create: jest.fn(), upsert: jest.fn() },
    // Batch form of $transaction: runs the prepared operations and returns their results in order
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new GradesService(prisma as unknown as PrismaService);

  const admin: AuthUser = { id: 1, email: 'admin@mitso.by', role: Role.ADMIN };
  const teacherUser: AuthUser = { id: 2, email: 'teacher@mitso.by', role: Role.TEACHER };
  const TEACHER_ID = 20;

  const row = (overrides: Partial<CreateGradeDto> = {}): CreateGradeDto => ({
    studentId: 100,
    subjectId: 5,
    gradeType: GradeType.EXAM,
    gradeValue: 8,
    ...overrides,
  });

  /** Teacher profile exists and is assigned to every subject, unless a test says otherwise. */
  function teacherOwnsEverything() {
    prisma.teacher.findUnique.mockResolvedValue({ id: TEACHER_ID });
    prisma.teacherSubject.findFirst.mockResolvedValue({ id: 1 });
  }

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.grade.upsert.mockImplementation(async (args) => ({ id: 1, ...args.create }));
    prisma.grade.create.mockImplementation(async (args) => ({ id: 1, ...args.data }));
    prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations));
    // Every student and subject referenced by the tests exists, unless a test says otherwise
    prisma.student.findMany.mockImplementation(async ({ where }) => where.id.in.map((id: number) => ({ id })));
    prisma.subject.findMany.mockImplementation(async ({ where }) => where.id.in.map((id: number) => ({ id })));
    prisma.teacherSubject.findMany.mockImplementation(async ({ where }) =>
      where.subjectId.in.map((subjectId: number) => ({ subjectId })),
    );
  });

  describe('create', () => {
    it('stores the teacher id for a teacher', async () => {
      teacherOwnsEverything();

      await service.create(row(), teacherUser);

      expect(prisma.grade.create.mock.calls[0][0].data.teacherId).toBe(TEACHER_ID);
    });

    it('stores no teacher id for an admin and skips the ownership lookups', async () => {
      await service.create(row(), admin);

      expect(prisma.grade.create.mock.calls[0][0].data.teacherId).toBeNull();
      expect(prisma.teacherSubject.findFirst).not.toHaveBeenCalled();
    });

    it('refuses an invalid value before touching the database', async () => {
      await expect(service.create(row({ gradeValue: 11 }), admin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.grade.create).not.toHaveBeenCalled();
    });
  });

  describe('batchCreate: permissions', () => {
    it('checks ownership of all subjects with one lookup, however many rows or subjects', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: TEACHER_ID });

      await service.batchCreate(
        [row({ studentId: 1 }), row({ studentId: 2 }), row({ studentId: 3, subjectId: 6 })],
        teacherUser,
      );

      expect(prisma.teacher.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.teacherSubject.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.teacherSubject.findMany.mock.calls[0][0].where).toEqual({
        teacherId: TEACHER_ID,
        subjectId: { in: [5, 6] },
      });
    });

    it('rejects the whole batch when the teacher has no profile', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.batchCreate([row()], teacherUser)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects the whole batch when one subject is not assigned to the teacher', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: TEACHER_ID });
      prisma.teacherSubject.findMany.mockResolvedValue([{ subjectId: 5 }]); // owns 5 but not 6

      await expect(service.batchCreate([row(), row({ subjectId: 6 })], teacherUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does not check ownership for an admin', async () => {
      await service.batchCreate([row()], admin);

      expect(prisma.teacher.findUnique).not.toHaveBeenCalled();
      expect(prisma.teacherSubject.findMany).not.toHaveBeenCalled();
    });
  });

  describe('batchCreate: writing', () => {
    it('upserts by the student + subject + type key', async () => {
      await service.batchCreate([row({ studentId: 7, subjectId: 9, gradeType: GradeType.LAB })], admin);

      expect(prisma.grade.upsert.mock.calls[0][0].where).toEqual({
        studentId_subjectId_gradeType: { studentId: 7, subjectId: 9, gradeType: GradeType.LAB },
      });
    });

    it('takes the teacher id from the ownership lookup, with no extra query', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: TEACHER_ID });

      await service.batchCreate([row({ notes: 'retake' })], teacherUser);

      const { create, update } = prisma.grade.upsert.mock.calls[0][0];
      expect(create.teacherId).toBe(TEACHER_ID);
      expect(Object.keys(update).sort()).toEqual(['examDate', 'gradeValue', 'notes']); // teacher is kept on update
      expect(prisma.teacher.findUnique).toHaveBeenCalledTimes(1);
    });

    it('converts examDate to a Date, or null when absent', async () => {
      await service.batchCreate(
        [row({ studentId: 1, examDate: '2026-01-15T00:00:00.000Z' }), row({ studentId: 2 })],
        admin,
      );

      const [withDate, withoutDate] = prisma.grade.upsert.mock.calls.map((c) => c[0].create);
      expect(withDate.examDate).toEqual(new Date('2026-01-15T00:00:00.000Z'));
      expect(withoutDate.examDate).toBeNull();
    });

    it('writes all valid rows in ONE transaction and touches the database a fixed number of times', async () => {
      const thirty = Array.from({ length: 30 }, (_, i) => row({ studentId: i + 1 }));

      await service.batchCreate(thirty, admin);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(30);
      // existence checks: one query for students, one for subjects, regardless of the batch size
      expect(prisma.student.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.subject.findMany).toHaveBeenCalledTimes(1);
    });

    it('does not open a transaction when no row is valid', async () => {
      const result = await service.batchCreate([row({ gradeValue: 0 })], admin);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toMatchObject({ total: 1, succeeded: 0, failed: 1, data: [] });
    });

    it('returns the saved rows in order', async () => {
      const result = await service.batchCreate([row({ studentId: 1 }), row({ studentId: 2 })], admin);

      expect(result.data.map((g) => g.studentId)).toEqual([1, 2]);
    });
  });

  describe('batchCreate: partial success (reported before anything is written)', () => {
    it('skips rows with an invalid value and reports their position', async () => {
      const result = await service.batchCreate(
        [row({ studentId: 1 }), row({ studentId: 2, gradeValue: 0 }), row({ studentId: 3 })],
        admin,
      );

      expect(prisma.grade.upsert).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({ total: 3, succeeded: 2, failed: 1 });
      expect(result.errors).toEqual([{ index: 1, reason: expect.stringMatching(/1 to 10/) }]);
    });

    it('reports a pass/fail credit with a value outside 0 and 1', async () => {
      const result = await service.batchCreate([row({ gradeType: GradeType.CREDIT, gradeValue: 7 })], admin);

      expect(result.errors).toEqual([{ index: 0, reason: expect.stringMatching(/0 \(not passed\) or 1 \(passed\)/) }]);
    });

    it('reports a student that does not exist and saves the rest', async () => {
      prisma.student.findMany.mockResolvedValue([{ id: 1 }, { id: 3 }]); // student 2 is missing

      const result = await service.batchCreate(
        [row({ studentId: 1 }), row({ studentId: 2 }), row({ studentId: 3 })],
        admin,
      );

      expect(result).toMatchObject({ total: 3, succeeded: 2, failed: 1 });
      expect(result.errors).toEqual([{ index: 1, reason: 'Student with ID 2 not found' }]);
    });

    it('reports a subject that does not exist', async () => {
      prisma.subject.findMany.mockResolvedValue([]);

      const result = await service.batchCreate([row()], admin);

      expect(result.errors).toEqual([{ index: 0, reason: 'Subject with ID 5 not found' }]);
    });

    it('lists errors in row order even when they come from different checks', async () => {
      prisma.student.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.batchCreate(
        [row({ studentId: 9 }), row({ studentId: 1, gradeValue: 0 }), row({ studentId: 1 })],
        admin,
      );

      expect(result.errors.map((e) => e.index)).toEqual([0, 1]);
    });
  });

  describe('batchCreate: a database failure', () => {
    it('is thrown, not reported per row: the transaction rolls back everything', async () => {
      prisma.$transaction.mockRejectedValue(new Error('connection lost'));

      await expect(service.batchCreate([row({ studentId: 1 }), row({ studentId: 2 })], admin)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('findGroupsBySubject', () => {
    it('counts students in the database instead of loading every student id to count them', async () => {
      prisma.subject.findUnique.mockResolvedValue({ id: 5 });
      prisma.subjectGroup.findMany.mockResolvedValue([
        { group: { id: 1, name: 'A', course: 1, facultyId: null, faculty: null, _count: { students: 27 } } },
      ]);

      const groups = await service.findGroupsBySubject(5);

      const { include } = prisma.subjectGroup.findMany.mock.calls[0][0];
      expect(include.group.include._count).toEqual({ select: { students: true } });
      expect(include.group.include.students).toBeUndefined();
      expect(groups[0].studentCount).toBe(27);
    });
  });
});
