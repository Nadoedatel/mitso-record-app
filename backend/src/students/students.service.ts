import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { PaginatedResponse } from '../common/dto';

/**
 * StudentsService - business logic for student management
 */
@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new student
   */
  async create(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
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
   * Find all students with optional search and pagination
   * @param query - pagination and search parameters
   */
  async findAll(query: QueryStudentDto): Promise<PaginatedResponse<any>> {
    const { search, groupId, page = 1, limit = 20 } = query;

    const where: any = {};

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
   * Find student by ID
   */
  async findOne(id: number) {
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
            faculty: true,
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
  async update(id: number, dto: UpdateStudentDto) {
    // Check if student exists
    await this.findOne(id);

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
      },
    });
  }

  /**
   * Delete student with transaction (also deletes related grades)
   */
  async remove(id: number) {
    // Check if student exists
    const student = await this.findOne(id);

    // Use transaction to ensure all related data is deleted atomically
    await this.prisma.$transaction(async (tx) => {
      // Delete all grades for this student
      await tx.grade.deleteMany({
        where: { studentId: id },
      });

      // Delete student
      await tx.student.delete({
        where: { id },
      });

      // If student has userId, optionally delete user account
      if (student.userId) {
        await tx.user.delete({
          where: { id: student.userId },
        });
      }
    });

    return { message: 'Student deleted successfully' };
  }
}
