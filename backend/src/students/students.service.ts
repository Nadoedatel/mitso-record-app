import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserCache, CacheService, InvalidatesCache } from '../cache';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Prisma, Role } from '@prisma/client';

/**
 * StudentsService - business logic for student management
 */
@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private authUsers: AuthUserCache,
  ) {}

  /**
   * Create a new student with a linked user account in a single transaction
   * @throws ConflictException if the email is already taken
   */
  @InvalidatesCache()
  async create(dto: CreateStudentDto) {
    const { email, password, birthDate, ...profileData } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role: Role.STUDENT },
      });

      return tx.student.create({
        data: {
          ...profileData,
          userId: user.id,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
        include: {
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });
    });
  }

  /**
   * Find all students with optional search and pagination
   * @param query - pagination and search parameters
   */
  async findAll(query: QueryStudentDto) {
    const { search, groupId, page = 1, limit = 20 } = query;

    const where: Prisma.StudentWhereInput = {};

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { studentId: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Add group filter
    if (groupId) {
      where.groupId = groupId;
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              course: true,
              faculty: true,
            },
          },
        },
        orderBy: {
          lastName: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.student.count({ where }),
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
   * Find student by ID (internal, no auth check)
   */
  private async findById(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  /**
   * Find student by ID
   * Students can only access their own record
   */
  async findOne(id: number, user: AuthUser) {
    if (user.role === Role.STUDENT) {
      const ownStudent = await this.prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!ownStudent || ownStudent.id !== id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            course: true,
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        specialization: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        grades: {
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
          orderBy: {
            examDate: 'desc',
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  /**
   * Find student by user ID
   */
  async findByUserId(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            course: true,
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        specialization: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student for user ${userId} not found`);
    }

    return student;
  }

  /**
   * Update student
   */
  @InvalidatesCache()
  async update(id: number, dto: UpdateStudentDto) {
    // Check if student exists
    await this.findById(id);

    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            course: true,
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        specialization: {
          select: {
            id: true,
            name: true,
            code: true,
            faculty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete student together with their login account.
   * The relation's `onDelete: Cascade` lives on the student's `userId`, i.e. deleting a USER removes
   * the student (and, through the student, the grades), but deleting a student row leaves the user row
   * behind, and that user could still log in. So the user is deleted, and the cascade does the rest.
   */
  @InvalidatesCache()
  async remove(id: number) {
    // Check if student exists
    const student = await this.findById(id);

    await this.prisma.user.delete({ where: { id: student.userId } });
    await this.authUsers.invalidate(student.userId);

    return { message: 'Student deleted successfully' };
  }
}
