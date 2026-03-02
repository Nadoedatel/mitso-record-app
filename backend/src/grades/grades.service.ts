import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto';
import { PaginatedResponse } from '../common/dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '@prisma/client';

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
   * Create a new grade
   * Teachers can only create grades for their own subjects
   */
  async create(dto: CreateGradeDto, user: AuthUser) {
    if (user.role === Role.TEACHER) {
      await this.assertTeacherOwnsSubject(user.id, dto.subjectId);
    }

    return this.prisma.grade.create({
      data: {
        ...dto,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
      },
      include: {
        student: true,
        subject: {
          include: {
            teacherSubjects: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find all grades with optional filters and pagination
   * Students are forcibly filtered to their own records
   */
  async findAll(query: QueryGradeDto, user: AuthUser): Promise<PaginatedResponse<any>> {
    const { studentId, subjectId, page = 1, limit = 20 } = query;

    const where: any = {};

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
          subject: {
            include: {
              teacherSubjects: {
                include: {
                  teacher: true,
                },
              },
            },
          },
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
        subject: {
          include: {
            teacherSubjects: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
      orderBy: [
        { subject: { semester: 'asc' } },
        { examDate: 'desc' },
      ],
    });
  }

  /**
   * Find grade by ID
   */
  async findOne(id: number) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: true,
        subject: {
          include: {
            teacherSubjects: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return grade;
  }

  /**
   * Update grade
   */
  async update(id: number, dto: UpdateGradeDto) {
    // Check if grade exists
    await this.findOne(id);

    return this.prisma.grade.update({
      where: { id },
      data: {
        ...dto,
        examDate: dto.examDate ? new Date(dto.examDate) : undefined,
      },
      include: {
        student: true,
        subject: {
          include: {
            teacherSubjects: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete grade
   */
  async remove(id: number) {
    // Check if grade exists
    await this.findOne(id);

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
            students: {
              select: {
                id: true,
              },
            },
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
      studentCount: sg.group.students.length,
    }));
  }

  /**
   * Get students for a specific group and subject
   * Returns students with their grades for this subject
   */
  async findStudentsByGroupAndSubject(groupId: number, subjectId: number) {
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
   * Batch create or update grades
   * Teachers can only create grades for their own subjects
   */
  async batchCreate(grades: CreateGradeDto[], user: AuthUser) {
    if (user.role === Role.TEACHER) {
      const subjectIds = [...new Set(grades.map((g) => g.subjectId))];
      for (const subjectId of subjectIds) {
        await this.assertTeacherOwnsSubject(user.id, subjectId);
      }
    }
    const results = await Promise.allSettled(
      grades.map((gradeDto) =>
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

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');

    return {
      total: grades.length,
      succeeded,
      failed: failed.length,
      errors: failed.map((f) => ({
        reason: f.status === 'rejected' ? f.reason.message : 'Unknown error',
      })),
      data: results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r.status === 'fulfilled' ? r.value : null)),
    };
  }
}
