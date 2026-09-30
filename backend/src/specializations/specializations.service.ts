import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, InvalidatesCache, DIRECTORY_NAMESPACE, DIRECTORY_TTL_SECONDS, stableKey } from '../cache';
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
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Create a new specialization
   */
  @InvalidatesCache()
  async create(dto: CreateSpecializationDto) {
    return this.prisma.specialization.create({
      data: dto,
      include: {
        faculty: true,
      },
    });
  }

  /**
   * Get all specializations (cached: the database is asked only on a miss, see cache invalidation on writes)
   */
  async findAll(query: QuerySpecializationDto) {
    return this.cache.getOrSet(DIRECTORY_NAMESPACE, `specializations:list:${stableKey(query)}`, DIRECTORY_TTL_SECONDS, () =>
      this.loadAll(query),
    );
  }

  /**
   * Get all specializations with optional filters and pagination
   */
  private async loadAll(query: QuerySpecializationDto) {
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
   * Get one specialization by ID (cached; a missing ID throws and is never cached)
   */
  async findOne(id: number) {
    return this.cache.getOrSet(DIRECTORY_NAMESPACE, `specializations:one:${id}`, DIRECTORY_TTL_SECONDS, () =>
      this.loadOne(id),
    );
  }

  /**
   * Get specialization by ID
   */
  private async loadOne(id: number) {
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
  @InvalidatesCache()
  async update(id: number, dto: UpdateSpecializationDto) {
    await this.loadOne(id); // Check if exists

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
  @InvalidatesCache()
  async remove(id: number) {
    await this.loadOne(id); // Check if exists

    await this.prisma.specialization.delete({
      where: { id },
    });

    return { message: 'Specialization deleted successfully' };
  }
}
