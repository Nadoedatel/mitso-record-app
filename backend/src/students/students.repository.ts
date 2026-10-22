import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { buildNameSearch } from '../common/search';
import { PrismaService } from '../prisma/prisma.service';

/** Columns the student search looks into; each has a trigram index (see the migration add_student_search_trigram_indexes) */
const STUDENT_SEARCH_COLUMNS = ['firstName', 'lastName', 'middleName', 'studentId'] as const;

const FACULTY = { select: { id: true, name: true } } as const;

/** What a student card shows next to the row: the account, the group and the specialization with their faculties */
const WITH_PROFILE = {
  user: { select: { id: true, email: true, role: true } },
  group: { select: { id: true, name: true, course: true, faculty: FACULTY } },
  specialization: { select: { id: true, name: true, code: true, faculty: FACULTY } },
} as const;

/** Profile fields of a new student (the account is created together with it) */
export type StudentProfile = Omit<Prisma.StudentUncheckedCreateInput, 'userId' | 'birthDate'>;

/** Fields of a student that may be changed */
export type StudentChanges = Omit<Prisma.StudentUncheckedUpdateInput, 'userId' | 'birthDate'> & { birthDate?: Date };

/**
 * StudentsRepository - every database query about students. StudentsService holds the rules (who may read which
 * record, what happens to the cache and to the account on delete); this knows the query shapes.
 */
@Injectable()
export class StudentsRepository {
  constructor(private prisma: PrismaService) {}

  /** True when some account already uses this email */
  async emailTaken(email: string): Promise<boolean> {
    return (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) !== null;
  }

  /**
   * Creates the login account and the student profile in ONE transaction:
   * no account without a student and no student without an account.
   */
  createWithAccount(account: { email: string; passwordHash: string }, profile: StudentProfile, birthDate: Date | null) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: account.email, password: account.passwordHash, role: Role.STUDENT },
      });

      return tx.student.create({
        data: { ...profile, userId: user.id, birthDate },
        include: { user: { select: { id: true, email: true, role: true } } },
      });
    });
  }

  /**
   * One page of students by last name, and the total for the pager.
   * Every word of `search` must be found in the name, patronymic or record book number.
   */
  async findPage(filter: { search?: string; groupId?: number }, page: number, limit: number) {
    const where: Prisma.StudentWhereInput = { ...buildNameSearch(filter.search, STUDENT_SEARCH_COLUMNS) };
    if (filter.groupId) where.groupId = filter.groupId;

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, role: true } },
          group: { select: { id: true, name: true, course: true, faculty: true } },
        },
        orderBy: { lastName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.student.count({ where }),
    ]);
    return { data, total };
  }

  /** The bare row, or null */
  findById(id: number) {
    return this.prisma.student.findUnique({ where: { id } });
  }

  /** Student profile id of a user, or null: used to check that a student asks only about themselves */
  async findIdByUserId(userId: number): Promise<number | null> {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    return student?.id ?? null;
  }

  /** The record card: profile plus every grade with its subject and the subject's teachers */
  findCard(id: number) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        ...WITH_PROFILE,
        grades: {
          include: { subject: { include: { teacherSubjects: { include: { teacher: true } } } } },
          orderBy: { examDate: 'desc' },
        },
      },
    });
  }

  findByUserId(userId: number) {
    return this.prisma.student.findUnique({ where: { userId }, include: WITH_PROFILE });
  }

  update(id: number, data: StudentChanges) {
    return this.prisma.student.update({ where: { id }, data, include: WITH_PROFILE });
  }

  /**
   * Deletes the LOGIN ACCOUNT of a student. The schema's `onDelete: Cascade` runs from user to profile,
   * so this removes the student and, through the student, the grades. Deleting only the profile row would
   * leave an account that can still sign in.
   */
  async deleteAccount(userId: number): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
