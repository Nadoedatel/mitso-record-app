import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto';
import { PaginatedResponse } from '../common/dto';

/**
 * GradesService - business logic for grade management
 */
@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new grade
   */
  async create(dto: CreateGradeDto) {
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
   */
  async findAll(query: QueryGradeDto): Promise<PaginatedResponse<any>> {
    const { studentId, subjectId, page = 1, limit = 20 } = query;

    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
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
   * This is the key endpoint mentioned in API conventions
   */
  async findByStudent(studentId: number) {
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
   * Batch create or update grades
   * Uses upsert to handle both creation and updates
   */
  async batchCreate(grades: CreateGradeDto[]) {
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
