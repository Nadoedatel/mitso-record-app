import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFacultyDto, UpdateFacultyDto, QueryFacultyDto } from './dto';

/**
 * FacultiesService - handles faculty business logic
 */
@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new faculty
   */
  async create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: dto,
    });
  }

  /**
   * Get all faculties with optional search and pagination
   */
  async findAll(query: QueryFacultyDto) {
    const { search, page = 1, limit = 20 } = query;

    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.faculty.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              specializations: true,
              groups: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.faculty.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get faculty by ID with specializations
   */
  async findOne(id: number) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        specializations: true,
        groups: true,
        _count: {
          select: {
            specializations: true,
            groups: true,
          },
        },
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty #${id} not found`);
    }

    return faculty;
  }

  /**
   * Update faculty
   */
  async update(id: number, dto: UpdateFacultyDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.faculty.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete faculty
   */
  async remove(id: number) {
    await this.findOne(id); // Check if exists

    await this.prisma.faculty.delete({
      where: { id },
    });

    return { message: 'Faculty deleted successfully' };
  }
}
