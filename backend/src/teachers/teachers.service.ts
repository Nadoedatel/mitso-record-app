import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto } from './dto';
import { PaginatedResponse } from '../common/dto';

/**
 * TeachersService - business logic for teacher management
 */
@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new teacher
   */
  async create(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find all teachers with optional search and pagination
   * @param query - pagination and search parameters
   */
  async findAll(query: QueryTeacherDto): Promise<PaginatedResponse<any>> {
    const { search, page = 1, limit = 20 } = query;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { department: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          teacherSubjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  semester: true,
                },
              },
            },
          },
        },
        orderBy: {
          lastName: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.teacher.count({ where }),
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
   * Find teacher by ID
   */
  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        teacherSubjects: {
          include: {
            subject: {
              include: {
                grades: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        studentId: true,
                      },
                    },
                  },
                },
                subjectGroups: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return teacher;
  }

  /**
   * Find teacher by user ID
   */
  async findByUserId(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        teacherSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher for user ${userId} not found`);
    }

    return teacher;
  }

  /**
   * Update teacher
   */
  async update(id: number, dto: UpdateTeacherDto) {
    // Check if teacher exists
    await this.findOne(id);

    return this.prisma.teacher.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Delete teacher with transaction
   */
  async remove(id: number) {
    // Check if teacher exists
    const teacher = await this.findOne(id);

    // Use transaction to ensure all related data is deleted atomically
    await this.prisma.$transaction(async (tx) => {
      // Delete teacher-subject relations
      await tx.teacherSubject.deleteMany({
        where: { teacherId: id },
      });

      // Delete teacher
      await tx.teacher.delete({
        where: { id },
      });

      // If teacher has userId, optionally delete user account
      if (teacher.userId) {
        await tx.user.delete({
          where: { id: teacher.userId },
        });
      }
    });

    return { message: 'Teacher deleted successfully' };
  }

  /**
   * Get subjects for a teacher
   */
  async getSubjects(teacherId: number) {
    // Check if teacher exists
    await this.findOne(teacherId);

    const teacherSubjects = await this.prisma.teacherSubject.findMany({
      where: { teacherId },
      include: {
        subject: {
          include: {
            grades: {
              select: {
                id: true,
                gradeValue: true,
                gradeType: true,
              },
            },
            subjectGroups: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    return teacherSubjects.map((ts) => ts.subject);
  }

  /**
   * Assign subjects to a teacher
   */
  async assignSubjects(teacherId: number, subjectIds: number[]) {
    // Check if teacher exists
    await this.findOne(teacherId);

    // Check if all subjects exist
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });

    if (subjects.length !== subjectIds.length) {
      throw new NotFoundException('One or more subjects not found');
    }

    // Create teacher-subject relations (ignore duplicates)
    const createPromises = subjectIds.map((subjectId) =>
      this.prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId,
            subjectId,
          },
        },
        create: {
          teacherId,
          subjectId,
        },
        update: {},
      }),
    );

    await Promise.all(createPromises);

    return this.getSubjects(teacherId);
  }

  /**
   * Remove a subject from a teacher
   */
  async removeSubject(teacherId: number, subjectId: number) {
    // Check if teacher exists
    await this.findOne(teacherId);

    // Delete the teacher-subject relation
    const deleted = await this.prisma.teacherSubject.deleteMany({
      where: {
        teacherId,
        subjectId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException(
        `Teacher ${teacherId} is not assigned to subject ${subjectId}`,
      );
    }

    return { message: 'Subject removed from teacher successfully' };
  }
}
