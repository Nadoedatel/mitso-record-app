import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';

/**
 * SubjectsService - business logic for subject management
 */
@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new subject
   */
  async create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: dto,
      include: {
        teacher: true,
      },
    });
  }

  /**
   * Find all subjects with optional filters
   */
  async findAll(teacherId?: number, semester?: number) {
    const where: any = {};

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (semester) {
      where.semester = semester;
    }

    return this.prisma.subject.findMany({
      where,
      include: {
        teacher: true,
        grades: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find subject by ID
   */
  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teacher: true,
        grades: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  /**
   * Update subject
   */
  async update(id: number, dto: UpdateSubjectDto) {
    // Check if subject exists
    await this.findOne(id);

    return this.prisma.subject.update({
      where: { id },
      data: dto,
      include: {
        teacher: true,
      },
    });
  }

  /**
   * Delete subject
   */
  async remove(id: number) {
    // Check if subject exists
    await this.findOne(id);

    await this.prisma.subject.delete({
      where: { id },
    });

    return { message: 'Subject deleted successfully' };
  }
}
