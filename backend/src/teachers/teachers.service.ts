import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserCache, CacheService, InvalidatesCache } from '../cache';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto } from './dto';

/**
 * TeachersService - business logic for teacher management
 */
@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private authUsers: AuthUserCache,
  ) {}

  /**
   * Create a new teacher with a linked user account in a single transaction
   */
  @InvalidatesCache()
  async create(dto: CreateTeacherDto) {
    const { email, password, ...profileData } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role: 'TEACHER' },
      });

      return tx.teacher.create({
        data: { ...profileData, userId: user.id },
        include: {
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });
    });
  }

  /**
   * Find all teachers with optional search and pagination
   * @param query - pagination and search parameters
   */
  async findAll(query: QueryTeacherDto) {
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
      throw new NotFoundException(`Преподаватель с ID ${id} не найден`);
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
      throw new NotFoundException(`Преподаватель для пользователя ${userId} не найден`);
    }

    return teacher;
  }

  /**
   * Update teacher
   */
  @InvalidatesCache()
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
   * Delete teacher together with their login account.
   * `onDelete: Cascade` on the teacher's `userId` means deleting a USER removes the teacher
   * (and their teacherSubjects), but deleting the teacher row would leave a user who can still log in.
   */
  @InvalidatesCache()
  async remove(id: number) {
    // Check if teacher exists
    const teacher = await this.findOne(id);

    await this.prisma.user.delete({ where: { id: teacher.userId } });
    await this.authUsers.invalidate(teacher.userId);

    return { message: 'Преподаватель удалён' };
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
  @InvalidatesCache()
  async assignSubjects(teacherId: number, subjectIds: number[]) {
    // Check if teacher exists
    await this.findOne(teacherId);

    // Check if all subjects exist
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });

    if (subjects.length !== subjectIds.length) {
      throw new NotFoundException('Один или несколько предметов не найдены');
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
  @InvalidatesCache()
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
        `Преподаватель ${teacherId} не назначен на предмет ${subjectId}`,
      );
    }

    return { message: 'Предмет снят с преподавателя' };
  }

  /**
   * Set subjects for a teacher (replaces all existing)
   */
  @InvalidatesCache()
  async setSubjects(teacherId: number, subjectIds: number[]) {
    // Check if teacher exists
    await this.findOne(teacherId);

    // Check if all subjects exist
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });

    if (subjects.length !== subjectIds.length) {
      throw new NotFoundException('Один или несколько предметов не найдены');
    }

    // Use transaction to replace all subjects
    await this.prisma.$transaction(async (tx) => {
      // Delete all existing relations
      await tx.teacherSubject.deleteMany({
        where: { teacherId },
      });

      // Create new relations
      if (subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            teacherId,
            subjectId,
          })),
        });
      }
    });

    return this.getSubjects(teacherId);
  }
}
