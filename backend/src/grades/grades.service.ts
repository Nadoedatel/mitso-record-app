import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../common/errors';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { assertGradeValue } from './grade-rules';
import { AuditEntry, AuditService, gradeChanged, GradeSnapshot, snapshotGrade } from '../audit';
import { GradeData, GradesRepository } from './grades.repository';

/**
 * GradesService - the rules of grades: who may read and write which grade, which values are valid,
 * what is written to the audit log. Database access is in GradesRepository.
 */
@Injectable()
export class GradesService {
  constructor(
    private grades: GradesRepository,
    private audit: AuditService,
  ) {}

  /**
   * Assert that a teacher owns the subject they are grading
   */
  private async assertTeacherOwnsSubject(userId: number, subjectId: number) {
    const teacherId = await this.grades.findTeacherIdByUserId(userId);
    if (teacherId === null) {
      throw new ForbiddenError('Профиль преподавателя не найден');
    }
    if (!(await this.grades.isTeacherAssignedToSubject(teacherId, subjectId))) {
      throw new ForbiddenError('Вы не назначены на этот предмет');
    }
  }

  /**
   * Assert that a teacher owns ALL the given subjects, with two queries regardless of how many subjects
   * (profile + one `IN` lookup), instead of two queries per subject.
   * @returns the teacher's profile ID, so the caller does not need another lookup
   */
  private async assertTeacherOwnsSubjects(userId: number, subjectIds: number[]): Promise<number> {
    const teacherId = await this.grades.findTeacherIdByUserId(userId);
    if (teacherId === null) {
      throw new ForbiddenError('Профиль преподавателя не найден');
    }

    const owned = await this.grades.findAssignedSubjectIds(teacherId, subjectIds);
    if (new Set(owned).size !== subjectIds.length) {
      throw new ForbiddenError('Вы не назначены на этот предмет');
    }

    return teacherId;
  }

  /**
   * Create a new grade
   * Teachers can only create grades for their own subjects
   */
  async create(dto: CreateGradeDto, user: AuthUser) {
    assertGradeValue(dto.gradeType, dto.gradeValue);

    if (user.role === Role.TEACHER) {
      await this.assertTeacherOwnsSubject(user.id, dto.subjectId);
    }

    const teacherId = user.role === Role.TEACHER ? await this.grades.findTeacherIdByUserId(user.id) : null;

    // The grade and its audit record are saved in one transaction
    return this.grades.transaction(async (tx) => {
      const grade = await this.grades.create(toGradeData(dto, teacherId), tx);
      await this.audit.record(tx, user, [auditEntry('GRADE_CREATE', grade.id, null, snapshotGrade(grade))]);
      return grade;
    });
  }

  /**
   * Find all grades with optional filters and pagination
   * Students are forcibly filtered to their own records
   */
  async findAll(query: QueryGradeDto, user: AuthUser) {
    const { studentId, subjectId, page = 1, limit = 20 } = query;

    let filterStudentId = studentId;
    if (user.role === Role.STUDENT) {
      // Force-filter to current student's records only
      const ownStudentId = await this.grades.findStudentIdByUserId(user.id);
      if (ownStudentId === null) {
        throw new ForbiddenError('Профиль студента не найден');
      }
      filterStudentId = ownStudentId;
    }

    const { data, total } = await this.grades.findPage({ studentId: filterStudentId, subjectId }, page, limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find grades for a specific student
   * Students can only access their own grades
   */
  async findByStudent(studentId: number, user: AuthUser) {
    if (user.role === Role.STUDENT) {
      const ownStudentId = await this.grades.findStudentIdByUserId(user.id);
      if (ownStudentId !== studentId) {
        throw new ForbiddenError('Доступ запрещён');
      }
    }

    return this.grades.findByStudent(studentId);
  }

  /**
   * Find grade by ID
   * Students can only read their own grades
   */
  async findOne(id: number, user: AuthUser) {
    const grade = await this.getOrThrow(id);

    if (user.role === Role.STUDENT) {
      const ownStudentId = await this.grades.findStudentIdByUserId(user.id);
      if (ownStudentId !== grade.studentId) {
        throw new ForbiddenError('Доступ запрещён');
      }
    }

    return grade;
  }

  /**
   * Load a grade with relations or throw 404 (no access checks, for internal use)
   */
  private async getOrThrow(id: number) {
    const grade = await this.grades.findById(id);

    if (!grade) {
      throw new NotFoundError(`Оценка с ID ${id} не найдена`);
    }

    return grade;
  }

  /**
   * Update grade
   * Teachers can only edit grades of subjects assigned to them (and move a grade only to such subjects)
   */
  async update(id: number, dto: UpdateGradeDto, user: AuthUser) {
    // Check if grade exists
    const existing = await this.getOrThrow(id);

    if (user.role === Role.TEACHER) {
      await this.assertTeacherOwnsSubject(user.id, existing.subjectId);
      if (dto.subjectId !== undefined && dto.subjectId !== existing.subjectId) {
        await this.assertTeacherOwnsSubject(user.id, dto.subjectId);
      }
    }

    if (dto.gradeValue !== undefined || dto.gradeType !== undefined) {
      assertGradeValue(
        dto.gradeType ?? existing.gradeType,
        dto.gradeValue ?? existing.gradeValue,
      );
    }

    return this.grades.transaction(async (tx) => {
      // Read inside the transaction: the "before" snapshot must be what the update really replaced
      const before = await this.grades.findById(id, tx);
      if (!before) throw new NotFoundError(`Оценка с ID ${id} не найдена`);

      const updated = await this.grades.update(
        id,
        { ...dto, examDate: dto.examDate ? new Date(dto.examDate) : undefined },
        tx,
      );

      const beforeSnapshot = snapshotGrade(before);
      const afterSnapshot = snapshotGrade(updated);
      if (gradeChanged(beforeSnapshot, afterSnapshot)) {
        await this.audit.record(tx, user, [auditEntry('GRADE_UPDATE', id, beforeSnapshot, afterSnapshot)]);
      }
      return updated;
    });
  }

  /**
   * Delete grade (the deleted values stay in the audit log)
   */
  async remove(id: number, user: AuthUser) {
    await this.grades.transaction(async (tx) => {
      const before = await this.grades.findById(id, tx);
      if (!before) throw new NotFoundError(`Оценка с ID ${id} не найдена`);

      await this.grades.delete(id, tx);
      await this.audit.record(tx, user, [auditEntry('GRADE_DELETE', id, snapshotGrade(before), null)]);
    });

    return { message: 'Оценка удалена' };
  }

  /**
   * Get groups assigned to a specific subject
   * Returns only groups that have this subject in their curriculum
   * This allows teachers to see which groups they can grade for this subject
   */
  async findGroupsBySubject(subjectId: number) {
    // Verify subject exists
    if (!(await this.grades.subjectExists(subjectId))) {
      throw new NotFoundError(`Предмет с ID ${subjectId} не найден`);
    }

    // Get only groups that are assigned to this subject via SubjectGroup relation
    const subjectGroups = await this.grades.findGroupsOfSubject(subjectId);

    return subjectGroups.map((sg) => ({
      id: sg.group.id,
      name: sg.group.name,
      course: sg.group.course,
      facultyId: sg.group.facultyId,
      faculty: sg.group.faculty,
      studentCount: sg.group._count.students,
    }));
  }

  /**
   * Get students for a specific group and subject
   * Returns students with their grades for this subject
   * Teachers can only list groups for subjects assigned to them
   */
  async findStudentsByGroupAndSubject(groupId: number, subjectId: number, user: AuthUser) {
    if (user.role === Role.TEACHER) {
      await this.assertTeacherOwnsSubject(user.id, subjectId);
    }

    return this.grades.findStudentsOfGroupWithGrades(groupId, subjectId);
  }

  /**
   * Batch create or update grades.
   *
   * 1. Permissions: a teacher must own every subject in the batch, otherwise the whole batch is refused (403).
   * 2. Validation BEFORE any write: the grade value for its type, and that the student and the subject exist.
   *    Rows that fail are reported in `errors` (with their position) and skipped: partial success is part of
   *    the API contract, the frontend shows "saved N of M".
   * 3. All valid rows are written in ONE transaction: they are saved together or not at all. A database failure
   *    during the write rolls everything back and is thrown (it is not a problem with a row), so a half-saved
   *    batch can no longer happen.
   */
  async batchCreate(grades: CreateGradeDto[], user: AuthUser) {
    let teacherId: number | null = null;
    if (user.role === Role.TEACHER) {
      const subjectIds = [...new Set(grades.map((g) => g.subjectId))];
      teacherId = await this.assertTeacherOwnsSubjects(user.id, subjectIds);
    }

    const { valid, errors } = await this.validateBatch(grades);

    const saved =
      valid.length === 0
        ? []
        : await this.grades.transaction(
            async (tx) => {
              // Current rows of the batch, to tell a create from an update and to keep the "before" values
              const existing = await this.grades.findByKeys(valid, tx);
              const before = new Map(existing.map((grade) => [gradeKey(grade), snapshotGrade(grade)]));

              const rows = [];
              const entries: AuditEntry[] = [];
              for (const gradeDto of valid) {
                const row = await this.grades.upsert(toGradeData(gradeDto, teacherId), tx);
                rows.push(row);

                const previous = before.get(gradeKey(row));
                const current = snapshotGrade(row);
                if (!previous) entries.push(auditEntry('GRADE_CREATE', row.id, null, current));
                else if (gradeChanged(previous, current)) entries.push(auditEntry('GRADE_UPDATE', row.id, previous, current));
              }

              await this.audit.record(tx, user, entries);
              return rows;
            },
            { timeoutMs: BATCH_TRANSACTION_TIMEOUT_MS },
          );

    return {
      total: grades.length,
      succeeded: saved.length,
      failed: errors.length,
      errors,
      data: saved,
    };
  }

  /**
   * Split a batch into rows that can be written and rows that cannot, without writing anything.
   * Existence of students and subjects is checked with one query each for the whole batch.
   */
  private async validateBatch(
    grades: CreateGradeDto[],
  ): Promise<{ valid: CreateGradeDto[]; errors: { index: number; reason: string }[] }> {
    const errors: { index: number; reason: string }[] = [];
    const candidates: { index: number; dto: CreateGradeDto }[] = [];

    grades.forEach((dto, index) => {
      try {
        assertGradeValue(dto.gradeType, dto.gradeValue);
        candidates.push({ index, dto });
      } catch (error) {
        errors.push({ index, reason: (error as Error).message });
      }
    });

    const [studentIdList, subjectIdList] = await Promise.all([
      this.grades.findExistingStudentIds([...new Set(candidates.map((c) => c.dto.studentId))]),
      this.grades.findExistingSubjectIds([...new Set(candidates.map((c) => c.dto.subjectId))]),
    ]);
    const studentIds = new Set(studentIdList);
    const subjectIds = new Set(subjectIdList);

    const valid: CreateGradeDto[] = [];
    for (const { index, dto } of candidates) {
      if (!studentIds.has(dto.studentId)) {
        errors.push({ index, reason: `Студент с ID ${dto.studentId} не найден` });
      } else if (!subjectIds.has(dto.subjectId)) {
        errors.push({ index, reason: `Предмет с ID ${dto.subjectId} не найден` });
      } else {
        valid.push(dto);
      }
    }

    return { valid, errors: errors.sort((a, b) => a.index - b.index) };
  }
}

/** A batch is written row by row inside one transaction; the default 5 s is too short for a few hundred rows */
const BATCH_TRANSACTION_TIMEOUT_MS = 30_000;

const gradeKey = (grade: { studentId: number; subjectId: number; gradeType: string }) =>
  `${grade.studentId}:${grade.subjectId}:${grade.gradeType}`;

/** Request body to row data: the date arrives as text, the teacher is decided by the service */
function toGradeData(dto: CreateGradeDto, teacherId: number | null): GradeData {
  return { ...dto, teacherId, examDate: dto.examDate ? new Date(dto.examDate) : null };
}

function auditEntry(
  action: AuditEntry['action'],
  entityId: number,
  before: GradeSnapshot | null,
  after: GradeSnapshot | null,
): AuditEntry {
  const reference = after ?? before;
  if (!reference) throw new Error('An audit entry needs a snapshot');
  return { action, entityId, studentId: reference.studentId, subjectId: reference.subjectId, before, after };
}
