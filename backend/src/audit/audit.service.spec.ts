import { Prisma, Role } from '@prisma/client';
import { InvalidInputError } from '../common/errors';
import { decodeCursor, encodeCursor } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { gradeChanged, GradeSnapshot, snapshotGrade } from './audit.snapshot';

const actor = { id: 3, email: 'teacher@mitso.by', role: Role.TEACHER };
const snapshot: GradeSnapshot = {
  studentId: 1,
  subjectId: 2,
  gradeType: 'EXAM',
  gradeValue: 8,
  examDate: null,
  notes: null,
  teacherId: null,
};

describe('AuditService', () => {
  const prisma = {
    auditLog: { findMany: jest.fn() },
    student: { findMany: jest.fn() },
    subject: { findMany: jest.fn() },
  };
  const tx = { auditLog: { createMany: jest.fn() } };
  const service = new AuditService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.student.findMany.mockResolvedValue([]);
    prisma.subject.findMany.mockResolvedValue([]);
  });

  describe('record', () => {
    it('copies the actor and writes through the given transaction client', async () => {
      await service.record(tx as unknown as Prisma.TransactionClient, actor, [
        { action: 'GRADE_CREATE', entityId: 5, studentId: 1, subjectId: 2, before: null, after: snapshot },
      ]);

      expect(tx.auditLog.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            actorId: 3,
            actorEmail: 'teacher@mitso.by',
            actorRole: 'TEACHER',
            action: 'GRADE_CREATE',
            entityId: 5,
            before: Prisma.JsonNull,
            after: snapshot,
          }),
        ],
      });
    });

    it('does nothing for an empty list', async () => {
      await service.record(tx as unknown as Prisma.TransactionClient, actor, []);
      expect(tx.auditLog.createMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lists newest first, asking for one row more than the page to learn whether there is a next page', async () => {
      const result = await service.findAll({});

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result).toEqual({ data: [], nextCursor: null, limit: 20 });
    });

    it('passes the filters through', async () => {
      await service.findAll({ studentId: 4, subjectId: 5, actorId: 6, action: 'GRADE_UPDATE', limit: 10 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 4, subjectId: 5, actorId: 6, action: 'GRADE_UPDATE' }, take: 11 }),
      );
    });

    describe('by cursor', () => {
      const at = (minutes: number) => new Date(Date.UTC(2026, 9, 14, 10, minutes));
      const rows = (ids: number[]) => ids.map((id) => ({ id, createdAt: at(id), studentId: null, subjectId: null }));

      it('returns the page and a cursor of its last row when more rows exist', async () => {
        prisma.auditLog.findMany.mockResolvedValue(rows([5, 4, 3])); // limit 2 asked 3: there is a next page

        const result = await service.findAll({ limit: 2 });

        expect(result.data.map((r) => r.id)).toEqual([5, 4]); // the extra row is not shown
        expect(decodeCursor(result.nextCursor as string)).toEqual({ at: at(4).toISOString(), id: 4 });
      });

      it('has no cursor on the last page', async () => {
        prisma.auditLog.findMany.mockResolvedValue(rows([2, 1]));

        const result = await service.findAll({ limit: 2 });

        expect(result.data).toHaveLength(2);
        expect(result.nextCursor).toBeNull();
      });

      it('continues strictly after the cursor row: older, or the same instant with a smaller id', async () => {
        const cursor = encodeCursor({ at: at(4).toISOString(), id: 4 });

        await service.findAll({ cursor });

        expect(prisma.auditLog.findMany.mock.calls[0][0].where.AND).toEqual([
          { OR: [{ createdAt: { lt: at(4) } }, { createdAt: at(4), id: { lt: 4 } }] },
        ]);
      });

      it('keeps the filters when it continues', async () => {
        const cursor = encodeCursor({ at: at(4).toISOString(), id: 4 });

        await service.findAll({ cursor, studentId: 9, from: '2026-10-01' });

        const { where } = prisma.auditLog.findMany.mock.calls[0][0];
        expect(where.studentId).toBe(9);
        expect(where.createdAt).toEqual({ gte: new Date('2026-10-01') });
        expect(where.AND).toBeDefined();
      });

      it('refuses a cursor that is not ours with a 400, and reads nothing', async () => {
        await expect(service.findAll({ cursor: 'garbage' })).rejects.toBeInstanceOf(InvalidInputError);
        expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
      });
    });

    it('includes the whole last day for a plain `to` date, but not for a timestamp', async () => {
      await service.findAll({ from: '2026-10-01', to: '2026-10-14' });
      expect(prisma.auditLog.findMany.mock.calls[0][0].where.createdAt).toEqual({
        gte: new Date('2026-10-01'),
        lte: new Date('2026-10-14T23:59:59.999Z'),
      });

      await service.findAll({ to: '2026-10-14T08:00:00.000Z' });
      expect(prisma.auditLog.findMany.mock.calls[1][0].where.createdAt).toEqual({ lte: new Date('2026-10-14T08:00:00.000Z') });
    });

    it('adds the current names of the student and the subject, null when they are gone', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        { id: 1, createdAt: new Date(), studentId: 1, subjectId: 2 },
        { id: 2, createdAt: new Date(), studentId: 99, subjectId: null },
      ]);
      prisma.student.findMany.mockResolvedValue([{ id: 1, firstName: 'Мария', lastName: 'Петрова' }]);
      prisma.subject.findMany.mockResolvedValue([{ id: 2, name: 'Базы данных' }]);

      const result = await service.findAll({});

      expect(result.data.map((r) => [r.studentName, r.subjectName])).toEqual([
        ['Петрова Мария', 'Базы данных'],
        [null, null],
      ]);
    });

    it('returns dates as strings', async () => {
      prisma.auditLog.findMany.mockResolvedValue([{ id: 1, createdAt: new Date('2026-10-14T10:00:00Z') }]);

      const result = await service.findAll({ limit: 20 });

      expect(result.data[0].createdAt).toBe('2026-10-14T10:00:00.000Z');
    });
  });
});

describe('snapshotGrade and gradeChanged', () => {
  it('keeps the audited fields, with dates as ISO strings and missing values as null', () => {
    expect(
      snapshotGrade({
        studentId: 1,
        subjectId: 2,
        gradeType: 'LAB',
        gradeValue: 7,
        examDate: new Date('2026-01-15T00:00:00Z'),
        notes: null,
        teacherId: 9,
      }),
    ).toEqual({ studentId: 1, subjectId: 2, gradeType: 'LAB', gradeValue: 7, examDate: '2026-01-15T00:00:00.000Z', notes: null, teacherId: 9 });
  });

  it('sees a change of the value, date or note, and ignores an identical copy', () => {
    expect(gradeChanged(snapshot, { ...snapshot })).toBe(false);
    expect(gradeChanged(snapshot, { ...snapshot, gradeValue: 9 })).toBe(true);
    expect(gradeChanged(snapshot, { ...snapshot, examDate: '2026-01-01T00:00:00.000Z' })).toBe(true);
    expect(gradeChanged(snapshot, { ...snapshot, notes: 'пересдача' })).toBe(true);
  });
});
