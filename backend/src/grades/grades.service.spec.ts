import { GradeType, Role } from '@prisma/client';
import { ForbiddenError, InvalidInputError, NotFoundError } from '../common/errors';
import { GradesService } from './grades.service';
import { GradesRepository } from './grades.repository';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateGradeDto } from './dto';
import { AuditService } from '../audit';

/** The service holds the rules; the repository (database access) is replaced by a fake here. */
describe('GradesService', () => {
  /** What the repository hands to the callback of a transaction: a sentinel, to see where it is passed on */
  const TX = { tx: true };
  const repo = {
    transaction: jest.fn(),
    findTeacherIdByUserId: jest.fn(),
    findStudentIdByUserId: jest.fn(),
    isTeacherAssignedToSubject: jest.fn(),
    findAssignedSubjectIds: jest.fn(),
    subjectExists: jest.fn(),
    findExistingStudentIds: jest.fn(),
    findExistingSubjectIds: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findPage: jest.fn(),
    findByStudent: jest.fn(),
    findByKeys: jest.fn(),
    upsert: jest.fn(),
    findGroupsOfSubject: jest.fn(),
    findStudentsOfGroupWithGrades: jest.fn(),
  };
  const audit = { record: jest.fn() };
  const service = new GradesService(repo as unknown as GradesRepository, audit as unknown as AuditService);

  const admin: AuthUser = { id: 1, email: 'admin@mitso.by', role: Role.ADMIN };
  const teacherUser: AuthUser = { id: 2, email: 'teacher@mitso.by', role: Role.TEACHER };
  const studentUser: AuthUser = { id: 3, email: 'student@mitso.by', role: Role.STUDENT };
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
    repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);
    repo.isTeacherAssignedToSubject.mockResolvedValue(true);
  }

  beforeEach(() => {
    jest.resetAllMocks();
    repo.transaction.mockImplementation((work: (tx: unknown) => Promise<unknown>) => work(TX));
    repo.create.mockImplementation(async (data) => ({ id: 1, ...data }));
    repo.upsert.mockImplementation(async (data) => ({ id: 1, ...data }));
    repo.findByKeys.mockResolvedValue([]);
    // Every student and subject referenced by the tests exists, and the teacher owns every subject, unless a test says otherwise
    repo.findExistingStudentIds.mockImplementation(async (ids: number[]) => ids);
    repo.findExistingSubjectIds.mockImplementation(async (ids: number[]) => ids);
    repo.findAssignedSubjectIds.mockImplementation(async (_teacherId: number, ids: number[]) => ids);
  });

  describe('create', () => {
    it('stores the teacher id for a teacher', async () => {
      teacherOwnsEverything();

      await service.create(row(), teacherUser);

      expect(repo.create.mock.calls[0][0].teacherId).toBe(TEACHER_ID);
    });

    it('stores no teacher id for an admin and skips the ownership lookups', async () => {
      await service.create(row(), admin);

      expect(repo.create.mock.calls[0][0].teacherId).toBeNull();
      expect(repo.isTeacherAssignedToSubject).not.toHaveBeenCalled();
    });

    it('refuses a teacher who is not assigned to the subject', async () => {
      repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);
      repo.isTeacherAssignedToSubject.mockResolvedValue(false);

      await expect(service.create(row(), teacherUser)).rejects.toBeInstanceOf(ForbiddenError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('refuses an invalid value before touching the database', async () => {
      await expect(service.create(row({ gradeValue: 11 }), admin)).rejects.toBeInstanceOf(InvalidInputError);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('reading: a student sees only their own grades', () => {
    it('findAll forces the filter to the student’s own id, whatever the query says', async () => {
      repo.findStudentIdByUserId.mockResolvedValue(77);
      repo.findPage.mockResolvedValue({ data: [], total: 0 });

      await service.findAll({ studentId: 999, page: 1, limit: 20 }, studentUser);

      expect(repo.findPage).toHaveBeenCalledWith({ studentId: 77, subjectId: undefined }, 1, 20);
    });

    it('findAll refuses a student account without a student profile', async () => {
      repo.findStudentIdByUserId.mockResolvedValue(null);
      await expect(service.findAll({}, studentUser)).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('findAll lets staff filter by any student and computes the page count', async () => {
      repo.findPage.mockResolvedValue({ data: [], total: 41 });

      const result = await service.findAll({ studentId: 5, subjectId: 6, page: 2, limit: 20 }, admin);

      expect(repo.findPage).toHaveBeenCalledWith({ studentId: 5, subjectId: 6 }, 2, 20);
      expect(result).toMatchObject({ total: 41, page: 2, limit: 20, totalPages: 3 });
    });

    it('findByStudent refuses a student who asks for someone else', async () => {
      repo.findStudentIdByUserId.mockResolvedValue(77);

      await expect(service.findByStudent(78, studentUser)).rejects.toBeInstanceOf(ForbiddenError);
      expect(repo.findByStudent).not.toHaveBeenCalled();
      await service.findByStudent(77, studentUser);
      expect(repo.findByStudent).toHaveBeenCalledWith(77);
    });

    it('findOne refuses a student for a grade of another student, and 404s a missing grade', async () => {
      repo.findStudentIdByUserId.mockResolvedValue(77);
      repo.findById.mockResolvedValueOnce({ id: 1, studentId: 78 });
      await expect(service.findOne(1, studentUser)).rejects.toBeInstanceOf(ForbiddenError);

      repo.findById.mockResolvedValueOnce(null);
      await expect(service.findOne(2, admin)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('batchCreate: permissions', () => {
    it('checks ownership of all subjects with one lookup, however many rows or subjects', async () => {
      repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);

      await service.batchCreate(
        [row({ studentId: 1 }), row({ studentId: 2 }), row({ studentId: 3, subjectId: 6 })],
        teacherUser,
      );

      expect(repo.findTeacherIdByUserId).toHaveBeenCalledTimes(1);
      expect(repo.findAssignedSubjectIds).toHaveBeenCalledTimes(1);
      expect(repo.findAssignedSubjectIds).toHaveBeenCalledWith(TEACHER_ID, [5, 6]);
    });

    it('rejects the whole batch when the teacher has no profile', async () => {
      repo.findTeacherIdByUserId.mockResolvedValue(null);

      await expect(service.batchCreate([row()], teacherUser)).rejects.toBeInstanceOf(ForbiddenError);
      expect(repo.transaction).not.toHaveBeenCalled();
    });

    it('rejects the whole batch when one subject is not assigned to the teacher', async () => {
      repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);
      repo.findAssignedSubjectIds.mockResolvedValue([5]); // owns 5 but not 6

      await expect(service.batchCreate([row(), row({ subjectId: 6 })], teacherUser)).rejects.toBeInstanceOf(
        ForbiddenError,
      );
      expect(repo.transaction).not.toHaveBeenCalled();
    });

    it('does not check ownership for an admin', async () => {
      await service.batchCreate([row()], admin);

      expect(repo.findTeacherIdByUserId).not.toHaveBeenCalled();
      expect(repo.findAssignedSubjectIds).not.toHaveBeenCalled();
    });
  });

  describe('batchCreate: writing', () => {
    it('writes each row through the repository upsert, inside the transaction', async () => {
      await service.batchCreate([row({ studentId: 7, subjectId: 9, gradeType: GradeType.LAB })], admin);

      expect(repo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: 7, subjectId: 9, gradeType: GradeType.LAB }),
        TX,
      );
    });

    it('takes the teacher id from the ownership lookup, with no extra query', async () => {
      repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);

      await service.batchCreate([row({ notes: 'retake' })], teacherUser);

      expect(repo.upsert.mock.calls[0][0]).toMatchObject({ teacherId: TEACHER_ID, notes: 'retake' });
      expect(repo.findTeacherIdByUserId).toHaveBeenCalledTimes(1);
    });

    it('converts examDate to a Date, or null when absent', async () => {
      await service.batchCreate(
        [row({ studentId: 1, examDate: '2026-01-15T00:00:00.000Z' }), row({ studentId: 2 })],
        admin,
      );

      const [withDate, withoutDate] = repo.upsert.mock.calls.map((c) => c[0]);
      expect(withDate.examDate).toEqual(new Date('2026-01-15T00:00:00.000Z'));
      expect(withoutDate.examDate).toBeNull();
    });

    it('writes all valid rows in ONE transaction and touches the database a fixed number of times', async () => {
      const thirty = Array.from({ length: 30 }, (_, i) => row({ studentId: i + 1 }));

      await service.batchCreate(thirty, admin);

      expect(repo.transaction).toHaveBeenCalledTimes(1);
      expect(repo.upsert).toHaveBeenCalledTimes(30);
      // one query for the current rows and one write of all audit records, regardless of the batch size
      expect(repo.findByKeys).toHaveBeenCalledTimes(1);
      expect(audit.record).toHaveBeenCalledTimes(1);
      // existence checks: one query for students, one for subjects, regardless of the batch size
      expect(repo.findExistingStudentIds).toHaveBeenCalledTimes(1);
      expect(repo.findExistingSubjectIds).toHaveBeenCalledTimes(1);
    });

    it('asks for a transaction timeout longer than the default: a batch is written row by row', async () => {
      await service.batchCreate([row()], admin);

      expect(repo.transaction.mock.calls[0][1]).toEqual({ timeoutMs: 30_000 });
    });

    it('does not open a transaction when no row is valid', async () => {
      const result = await service.batchCreate([row({ gradeValue: 0 })], admin);

      expect(repo.transaction).not.toHaveBeenCalled();
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

      expect(repo.upsert).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({ total: 3, succeeded: 2, failed: 1 });
      expect(result.errors).toEqual([{ index: 1, reason: expect.stringMatching(/от 1 до 10/) }]);
    });

    it('reports a pass/fail credit with a value outside 0 and 1', async () => {
      const result = await service.batchCreate([row({ gradeType: GradeType.CREDIT, gradeValue: 7 })], admin);

      expect(result.errors).toEqual([{ index: 0, reason: expect.stringMatching(/0 \(не сдано\) или 1 \(сдано\)/) }]);
    });

    it('reports a student that does not exist and saves the rest', async () => {
      repo.findExistingStudentIds.mockResolvedValue([1, 3]); // student 2 is missing

      const result = await service.batchCreate(
        [row({ studentId: 1 }), row({ studentId: 2 }), row({ studentId: 3 })],
        admin,
      );

      expect(result).toMatchObject({ total: 3, succeeded: 2, failed: 1 });
      expect(result.errors).toEqual([{ index: 1, reason: 'Студент с ID 2 не найден' }]);
    });

    it('reports a subject that does not exist', async () => {
      repo.findExistingSubjectIds.mockResolvedValue([]);

      const result = await service.batchCreate([row()], admin);

      expect(result.errors).toEqual([{ index: 0, reason: 'Предмет с ID 5 не найден' }]);
    });

    it('lists errors in row order even when they come from different checks', async () => {
      repo.findExistingStudentIds.mockResolvedValue([1]);

      const result = await service.batchCreate(
        [row({ studentId: 9 }), row({ studentId: 1, gradeValue: 0 }), row({ studentId: 1 })],
        admin,
      );

      expect(result.errors.map((e) => e.index)).toEqual([0, 1]);
    });
  });

  describe('batchCreate: a database failure', () => {
    it('is thrown, not reported per row: the transaction rolls back everything', async () => {
      repo.transaction.mockRejectedValue(new Error('connection lost'));

      await expect(service.batchCreate([row({ studentId: 1 }), row({ studentId: 2 })], admin)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('audit trail', () => {
    const existingRow = {
      id: 7,
      studentId: 100,
      subjectId: 5,
      teacherId: null,
      gradeType: GradeType.EXAM,
      gradeValue: 6,
      examDate: null,
      notes: null,
    };

    /** The entries handed to the audit log by the last write */
    const recorded = () => audit.record.mock.calls.flatMap((call) => call[2] as { action: string; before: unknown; after: unknown }[]);

    it('records a created grade with the actor and the new values', async () => {
      await service.create(row({ gradeValue: 9 }), admin);

      expect(audit.record).toHaveBeenCalledWith(TX, admin, [
        expect.objectContaining({ action: 'GRADE_CREATE', studentId: 100, subjectId: 5, before: null, after: expect.objectContaining({ gradeValue: 9 }) }),
      ]);
    });

    it('saves the grade and its record in the same transaction', async () => {
      await service.create(row(), admin);

      expect(repo.transaction).toHaveBeenCalledTimes(1);
      expect(repo.create.mock.calls[0][1]).toBe(TX);
      expect(audit.record.mock.calls[0][0]).toBe(TX); // the transaction client, not a separate connection
    });

    it('records an update with the values before and after', async () => {
      repo.findById.mockResolvedValue(existingRow);
      repo.update.mockResolvedValue({ ...existingRow, gradeValue: 8 });

      await service.update(7, { gradeValue: 8 }, admin);

      expect(recorded()).toEqual([
        expect.objectContaining({
          action: 'GRADE_UPDATE',
          before: expect.objectContaining({ gradeValue: 6 }),
          after: expect.objectContaining({ gradeValue: 8 }),
        }),
      ]);
    });

    it('records nothing when an update changes nothing', async () => {
      repo.findById.mockResolvedValue(existingRow);
      repo.update.mockResolvedValue({ ...existingRow });

      await service.update(7, { gradeValue: 6 }, admin);

      expect(recorded()).toEqual([]);
    });

    it('lets a teacher edit only grades of their own subjects, and move a grade only to such a subject', async () => {
      repo.findById.mockResolvedValue(existingRow);
      repo.update.mockResolvedValue(existingRow);
      repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);
      repo.isTeacherAssignedToSubject.mockImplementation(async (_teacherId: number, subjectId: number) => subjectId === 5);

      await service.update(7, { notes: 'x' }, teacherUser); // own subject 5: fine
      await expect(service.update(7, { subjectId: 6 }, teacherUser)).rejects.toBeInstanceOf(ForbiddenError); // 6 is not theirs
    });

    it('rejects a value that does not fit the type, checking against the stored type when only the value changes', async () => {
      repo.findById.mockResolvedValue({ ...existingRow, gradeType: GradeType.CREDIT });

      await expect(service.update(7, { gradeValue: 7 }, admin)).rejects.toBeInstanceOf(InvalidInputError);
      expect(repo.transaction).not.toHaveBeenCalled();
    });

    it('records a deletion with the deleted values', async () => {
      repo.findById.mockResolvedValue(existingRow);

      await service.remove(7, admin);

      expect(repo.delete).toHaveBeenCalledWith(7, TX);
      expect(recorded()).toEqual([
        expect.objectContaining({ action: 'GRADE_DELETE', entityId: 7, before: expect.objectContaining({ gradeValue: 6 }), after: null }),
      ]);
    });

    it('does not delete or record anything for a grade that does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.remove(7, admin)).rejects.toBeInstanceOf(NotFoundError);
      expect(repo.delete).not.toHaveBeenCalled();
      expect(audit.record).not.toHaveBeenCalled();
    });

    it('batch: records a create for a new grade, an update for a changed one and nothing for an unchanged one', async () => {
      repo.findByKeys.mockResolvedValue([
        { ...existingRow, id: 1, studentId: 1, gradeValue: 5 }, // will change to 8
        { ...existingRow, id: 2, studentId: 2, gradeValue: 9 }, // stays 9
      ]);

      await service.batchCreate(
        [row({ studentId: 1, gradeValue: 8 }), row({ studentId: 2, gradeValue: 9 }), row({ studentId: 3, gradeValue: 7 })],
        admin,
      );

      expect(recorded().map((entry) => [entry.action, (entry.after as { studentId: number }).studentId])).toEqual([
        ['GRADE_UPDATE', 1],
        ['GRADE_CREATE', 3],
      ]);
    });

    it('batch: a failure while saving is thrown and nothing is recorded outside the transaction', async () => {
      repo.upsert.mockRejectedValueOnce(new Error('db down'));

      await expect(service.batchCreate([row()], admin)).rejects.toThrow('db down');
      expect(audit.record).not.toHaveBeenCalled();
    });
  });

  describe('lists for the grade entry screens', () => {
    it('findGroupsBySubject: 404 for an unknown subject, otherwise a flat group list with the student count', async () => {
      repo.subjectExists.mockResolvedValueOnce(false);
      await expect(service.findGroupsBySubject(5)).rejects.toBeInstanceOf(NotFoundError);

      repo.subjectExists.mockResolvedValueOnce(true);
      repo.findGroupsOfSubject.mockResolvedValue([
        { group: { id: 1, name: 'A', course: 1, facultyId: null, faculty: null, _count: { students: 27 } } },
      ]);

      expect(await service.findGroupsBySubject(5)).toEqual([
        { id: 1, name: 'A', course: 1, facultyId: null, faculty: null, studentCount: 27 },
      ]);
    });

    it('findStudentsByGroupAndSubject: a teacher needs the subject, an admin does not', async () => {
      repo.findStudentsOfGroupWithGrades.mockResolvedValue([]);
      repo.findTeacherIdByUserId.mockResolvedValue(TEACHER_ID);
      repo.isTeacherAssignedToSubject.mockResolvedValue(false);

      await expect(service.findStudentsByGroupAndSubject(1, 5, teacherUser)).rejects.toBeInstanceOf(ForbiddenError);
      await service.findStudentsByGroupAndSubject(1, 5, admin);

      expect(repo.findStudentsOfGroupWithGrades).toHaveBeenCalledWith(1, 5);
      expect(repo.findStudentsOfGroupWithGrades).toHaveBeenCalledTimes(1);
    });
  });
});
