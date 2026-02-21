import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';

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
   * Find all teachers with optional search
   * @param search - search by firstName, lastName, or department
   */
  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { department: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        subjects: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
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
        subjects: {
          include: {
            grades: {
              include: {
                student: true,
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
        subjects: true,
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
   * Delete teacher
   */
  async remove(id: number) {
    // Check if teacher exists
    await this.findOne(id);

    await this.prisma.teacher.delete({
      where: { id },
    });

    return { message: 'Teacher deleted successfully' };
  }
}
