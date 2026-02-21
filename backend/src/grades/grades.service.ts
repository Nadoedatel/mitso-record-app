import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto } from './dto';

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
            teacher: true,
          },
        },
      },
    });
  }

  /**
   * Find all grades with optional filters
   */
  async findAll(studentId?: number, subjectId?: number) {
    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    return this.prisma.grade.findMany({
      where,
      include: {
        student: true,
        subject: {
          include: {
            teacher: true,
          },
        },
      },
      orderBy: {
        examDate: 'desc',
      },
    });
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
            teacher: true,
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
            teacher: true,
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
            teacher: true,
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
}
