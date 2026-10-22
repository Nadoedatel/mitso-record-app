import { Injectable } from '@nestjs/common';
import { GradeType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** The Prisma client of a transaction: pass it to a method to run that query inside the transaction */
export type Db = Prisma.TransactionClient;

/** What a new grade needs; the service decides the values, the repository only writes them */
export interface GradeData {
  studentId: number;
  subjectId: number;
  gradeValue: number;
  gradeType: GradeType;
  examDate: Date | null;
  notes?: string | null;
  teacherId: number | null;
}

/** Fields of a grade that may be changed (the teacher who set it stays as it was) */
export type GradeChanges = Partial<Omit<GradeData, 'teacherId'>>;

/** A grade is identified by student + subject + type (unique in the database) */
export interface GradeKey {
  studentId: number;
  subjectId: number;
  gradeType: GradeType;
}

/** Relations every grade endpoint returns together with the row */
const WITH_RELATIONS = { student: true, teacher: true, subject: true } as const;

/**
 * GradesRepository - every database query of the grade screens, in one place.
 * GradesService holds the rules (who may do what, which values are valid, what goes to the audit log) and calls
 * this for data; it does not know Prisma's query shapes. Methods take an optional `db`: pass the client of a
 * transaction to run the query inside it, leave it out to use the normal connection.
 */
@Injectable()
export class GradesRepository {
  constructor(private prisma: PrismaService) {}

  /** Runs `work` in one database transaction: everything inside is saved together or not at all */
  transaction<T>(work: (tx: Db) => Promise<T>, options?: { timeoutMs?: number }): Promise<T> {
    return this.prisma.$transaction(work, options?.timeoutMs ? { timeout: options.timeoutMs } : undefined);
  }

  // People and subjects (read-only lookups the grade rules need)

  /** Teacher profile id of a user, or null if the user has no teacher profile */
  async findTeacherIdByUserId(userId: number): Promise<number | null> {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    return teacher?.id ?? null;
  }

  /** Student profile id of a user, or null if the user has no student profile */
  async findStudentIdByUserId(userId: number): Promise<number | null> {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    return student?.id ?? null;
  }

  async isTeacherAssignedToSubject(teacherId: number, subjectId: number): Promise<boolean> {
    return (await this.prisma.teacherSubject.findFirst({ where: { teacherId, subjectId } })) !== null;
  }

  /** Which of the given subjects the teacher is assigned to: one query however many subjects */
  async findAssignedSubjectIds(teacherId: number, subjectIds: number[]): Promise<number[]> {
    const links = await this.prisma.teacherSubject.findMany({
      where: { teacherId, subjectId: { in: subjectIds } },
      select: { subjectId: true },
    });
    return links.map((link) => link.subjectId);
  }

  async subjectExists(id: number): Promise<boolean> {
    return (await this.prisma.subject.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  /** Which of the given students exist (one query for the whole batch) */
  async findExistingStudentIds(ids: number[]): Promise<number[]> {
    const rows = await this.prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return rows.map((row) => row.id);
  }

  /** Which of the given subjects exist (one query for the whole batch) */
  async findExistingSubjectIds(ids: number[]): Promise<number[]> {
    const rows = await this.prisma.subject.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return rows.map((row) => row.id);
  }

  // Grades

  findById(id: number, db: Db = this.prisma) {
    return db.grade.findUnique({ where: { id }, include: WITH_RELATIONS });
  }

  create(data: GradeData, db: Db = this.prisma) {
    return db.grade.create({ data, include: WITH_RELATIONS });
  }

  update(id: number, data: GradeChanges, db: Db = this.prisma) {
    return db.grade.update({ where: { id }, data, include: WITH_RELATIONS });
  }

  async delete(id: number, db: Db = this.prisma): Promise<void> {
    await db.grade.delete({ where: { id } });
  }

  /** One page of grades, newest exam first, and the total for the pager */
  async findPage(filter: { studentId?: number; subjectId?: number }, page: number, limit: number) {
    const where: Prisma.GradeWhereInput = { studentId: filter.studentId, subjectId: filter.subjectId };
    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        include: WITH_RELATIONS,
        orderBy: { examDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.grade.count({ where }),
    ]);
    return { data, total };
  }

  /** All grades of a student, by semester and then newest first */
  findByStudent(studentId: number) {
    return this.prisma.grade.findMany({
      where: { studentId },
      include: { teacher: true, subject: true },
      orderBy: [{ subject: { semester: 'asc' } }, { examDate: 'desc' }],
    });
  }

  /** The existing rows among the given keys (to tell a create from an update in a batch) */
  findByKeys(keys: GradeKey[], db: Db = this.prisma) {
    return db.grade.findMany({
      where: { OR: keys.map(({ studentId, subjectId, gradeType }) => ({ studentId, subjectId, gradeType })) },
    });
  }

  /** Creates the grade, or changes value, date and note of the existing one (the teacher stays as it was) */
  upsert(data: GradeData, db: Db = this.prisma) {
    return db.grade.upsert({
      where: {
        studentId_subjectId_gradeType: { studentId: data.studentId, subjectId: data.subjectId, gradeType: data.gradeType },
      },
      create: data,
      update: { gradeValue: data.gradeValue, examDate: data.examDate, notes: data.notes },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });
  }

  // Lists for the grade entry screens

  /** Groups that have the subject in their curriculum, with faculty and a student COUNT (not the students) */
  findGroupsOfSubject(subjectId: number) {
    return this.prisma.subjectGroup.findMany({
      where: { subjectId },
      include: {
        group: {
          include: {
            faculty: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
        },
      },
      orderBy: { group: { name: 'asc' } },
    });
  }

  /** Students of a group with their grades in one subject (the grade entry table) */
  findStudentsOfGroupWithGrades(groupId: number, subjectId: number) {
    return this.prisma.student.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, email: true } },
        group: { select: { id: true, name: true, course: true } },
        grades: {
          where: { subjectId },
          include: { subject: { select: { id: true, name: true, code: true } } },
          orderBy: { examDate: 'desc' },
        },
      },
      orderBy: { lastName: 'asc' },
    });
  }
}
