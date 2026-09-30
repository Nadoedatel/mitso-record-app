import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Prisma, Role } from '@prisma/client';
import { assertGradeValue } from './grade-rules';

/**
 * GradesService - business logic for grade management
 */
@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assert that a teacher owns the subject they are grading
   */
  private async assertTeacherOwnsSubject(userId: number, subjectId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) {
      throw new ForbiddenException('Teacher profile not found');
    }
    const link = await this.prisma.teacherSubject.findFirst({
      where: { teacherId: teacher.id, subjectId },
    });
    if (!link) {
      throw new ForbiddenException('You are not assigned to this subject');
    }
  }

  /**
   * Assert that a teacher owns ALL the given subjects, with two queries regardless of how many subjects
   * (profile + one `IN` lookup), instead of two queries per subject.
   * @returns the teacher's profile ID, so the caller does not need another lookup
   */
  private async assertTeacherOwnsSubjects(userId: number, subjectIds: number[]): Promise<number> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) {
      throw new ForbiddenException('Teacher profile not found');
    }

    const owned = await this.prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id, subjectId: { in: subjectIds } },
      select: { subjectId: true },
    });
    if (new Set(owned.map((link) => link.subjectId)).size !== subjectIds.length) {
      throw new ForbiddenException('You are not assigned to this subject');
    }

    return teacher.id;
  }

  /**
   * Resolve teacher ID from user ID
   */
  private async getTeacherId(userId: number): Promise<number | null> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    return teacher?.id ?? null;
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

    const teacherId =
      user.role === Role.TEACHER ? await this.getTeacherId(user.id) : null;

    return this.prisma.grade.create({
      data: {
        ...dto,
        teacherId,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
      },
      include: {
        student: true,
        teacher: true,
        subject: true,
      },
    });
  }

  /**
   * Find all grades with optional filters and pagination
   * Students are forcibly filtered to their own records
   */
  async findAll(query: QueryGradeDto, user: AuthUser) {
    const { studentId, subjectId, page = 1, limit = 20 } = query;

    const where: Prisma.GradeWhereInput = {};

    if (user.role === Role.STUDENT) {
      // Force-filter to current student's records only
      const ownStudent = await this.prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!ownStudent) {
        throw new ForbiddenException('Student profile not found');
      }
      where.studentId = ownStudent.id;
    } else {
      if (studentId) {
        where.studentId = studentId;
      }
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        include: {
          student: true,
          teacher: true,
          subject: true,
        },
        orderBy: {
          examDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.grade.count({ where }),
    ]);

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
      const ownStudent = await this.prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!ownStudent || ownStudent.id !== studentId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        teacher: true,
        subject: true,
      },
      orderBy: [
        { subject: { semester: 'asc' } },
        { examDate: 'desc' },
      ],
    });
  }

  /**
   * Find grade by ID
   * Students can only read their own grades
   */
  async findOne(id: number, user: AuthUser) {
    const grade = await this.getOrThrow(id);

    if (user.role === Role.STUDENT) {
      const ownStudent = await this.prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!ownStudent || ownStudent.id !== grade.studentId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return grade;
  }

  /**
   * Load a grade with relations or throw 404 (no access checks, for internal use)
   */
  private async getOrThrow(id: number) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        subject: true,
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
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

    return this.prisma.grade.update({
      where: { id },
      data: {
        ...dto,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
      },
      include: {
        student: true,
        teacher: true,
        subject: true,
      },
    });
  }

  /**
   * Delete grade
   */
  async remove(id: number) {
    // Check if grade exists
    await this.getOrThrow(id);

    await this.prisma.grade.delete({
      where: { id },
    });

    return { message: 'Grade deleted successfully' };
  }

  /**
   * Get groups assigned to a specific subject
   * Returns only groups that have this subject in their curriculum
   * This allows teachers to see which groups they can grade for this subject
   */
  async findGroupsBySubject(subjectId: number) {
    // Verify subject exists
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    // Get only groups that are assigned to this subject via SubjectGroup relation
    const subjectGroups = await this.prisma.subjectGroup.findMany({
      where: { subjectId },
      include: {
        group: {
          include: {
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: { select: { students: true } },
          },
        },
      },
      orderBy: {
        group: {
          name: 'asc',
        },
      },
    });

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

    // Get all students in the group
    const students = await this.prisma.student.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            course: true,
          },
        },
        grades: {
          where: { subjectId },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            examDate: 'desc',
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return students;
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
        : await this.prisma.$transaction(
            valid.map((gradeDto) =>
              this.prisma.grade.upsert({
                where: {
                  studentId_subjectId_gradeType: {
                    studentId: gradeDto.studentId,
                    subjectId: gradeDto.subjectId,
                    gradeType: gradeDto.gradeType,
                  },
                },
                create: {
                  ...gradeDto,
                  teacherId,
                  examDate: gradeDto.examDate ? new Date(gradeDto.examDate) : null,
                },
                update: {
                  gradeValue: gradeDto.gradeValue,
                  examDate: gradeDto.examDate ? new Date(gradeDto.examDate) : null,
                  notes: gradeDto.notes,
                },
                include: {
                  student: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      studentId: true,
                    },
                  },
                  subject: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              }),
            ),
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

    const [students, subjects] = await Promise.all([
      this.prisma.student.findMany({
        where: { id: { in: [...new Set(candidates.map((c) => c.dto.studentId))] } },
        select: { id: true },
      }),
      this.prisma.subject.findMany({
        where: { id: { in: [...new Set(candidates.map((c) => c.dto.subjectId))] } },
        select: { id: true },
      }),
    ]);
    const studentIds = new Set(students.map((s) => s.id));
    const subjectIds = new Set(subjects.map((s) => s.id));

    const valid: CreateGradeDto[] = [];
    for (const { index, dto } of candidates) {
      if (!studentIds.has(dto.studentId)) {
        errors.push({ index, reason: `Student with ID ${dto.studentId} not found` });
      } else if (!subjectIds.has(dto.subjectId)) {
        errors.push({ index, reason: `Subject with ID ${dto.subjectId} not found` });
      } else {
        valid.push(dto);
      }
    }

    return { valid, errors: errors.sort((a, b) => a.index - b.index) };
  }
}
