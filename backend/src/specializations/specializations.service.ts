import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSpecializationDto,
  UpdateSpecializationDto,
  QuerySpecializationDto,
} from './dto';

/**
 * SpecializationsService - handles specialization business logic
 */
@Injectable()
export class SpecializationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new specialization
   */
  async create(dto: CreateSpecializationDto) {
    return this.prisma.specialization.create({
      data: dto,
      include: {
        faculty: true,
      },
    });
  }

  /**
   * Get all specializations with optional filters and pagination
   */
  async findAll(query: QuerySpecializationDto) {
    const { facultyId, search, page = 1, limit = 20 } = query;

    const where: Prisma.SpecializationWhereInput = {};

    if (facultyId) {
      where.facultyId = facultyId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.specialization.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          faculty: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.specialization.count({ where }),
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
   * Get specialization by ID
   */
  async findOne(id: number) {
    const specialization = await this.prisma.specialization.findUnique({
      where: { id },
      include: {
        faculty: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!specialization) {
      throw new NotFoundException(`Specialization #${id} not found`);
    }

    return specialization;
  }

  /**
   * Update specialization
   */
  async update(id: number, dto: UpdateSpecializationDto) {
    await this.findOne(id); // Check if exists

    return this.prisma.specialization.update({
      where: { id },
      data: dto,
      include: {
        faculty: true,
      },
    });
  }

  /**
   * Delete specialization
   */
  async remove(id: number) {
    await this.findOne(id); // Check if exists

    await this.prisma.specialization.delete({
      where: { id },
    });

    return { message: 'Specialization deleted successfully' };
  }
}
