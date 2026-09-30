import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, InvalidatesCache, DIRECTORY_NAMESPACE, DIRECTORY_TTL_SECONDS, stableKey } from '../cache';
import { CreateFacultyDto, UpdateFacultyDto, QueryFacultyDto } from './dto';

/**
 * FacultiesService - handles faculty business logic
 */
@Injectable()
export class FacultiesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Create a new faculty
   */
  @InvalidatesCache()
  async create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: dto,
    });
  }

  /**
   * Get all faculties (cached: the database is asked only on a miss, see cache invalidation on writes)
   */
  async findAll(query: QueryFacultyDto) {
    return this.cache.getOrSet(DIRECTORY_NAMESPACE, `faculties:list:${stableKey(query)}`, DIRECTORY_TTL_SECONDS, () =>
      this.loadAll(query),
    );
  }

  /**
   * Get all faculties with optional search and pagination
   */
  private async loadAll(query: QueryFacultyDto) {
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
   * Get one faculty by ID (cached; a missing ID throws and is never cached)
   */
  async findOne(id: number) {
    return this.cache.getOrSet(DIRECTORY_NAMESPACE, `faculties:one:${id}`, DIRECTORY_TTL_SECONDS, () =>
      this.loadOne(id),
    );
  }

  /**
   * Get faculty by ID with specializations
   */
  private async loadOne(id: number) {
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
  @InvalidatesCache()
  async update(id: number, dto: UpdateFacultyDto) {
    await this.loadOne(id); // Check if exists

    return this.prisma.faculty.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete faculty
   */
  @InvalidatesCache()
  async remove(id: number) {
    await this.loadOne(id); // Check if exists

    await this.prisma.faculty.delete({
      where: { id },
    });

    return { message: 'Faculty deleted successfully' };
  }
}
