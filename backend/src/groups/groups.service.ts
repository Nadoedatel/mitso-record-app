import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, InvalidatesCache, DIRECTORY_NAMESPACE, DIRECTORY_TTL_SECONDS, stableKey } from '../cache';
import { CreateGroupDto, UpdateGroupDto, QueryGroupDto } from './dto';

/**
 * GroupsService - business logic for group management
 */
@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /**
   * Create a new group
   */
  @InvalidatesCache()
  async create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: dto,
      include: {
        students: true,
        subjectGroups: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  /**
   * Get all groups (cached: the database is asked only on a miss, see cache invalidation on writes)
   */
  async findAll(query: QueryGroupDto) {
    return this.cache.getOrSet(DIRECTORY_NAMESPACE, `groups:list:${stableKey(query)}`, DIRECTORY_TTL_SECONDS, () =>
      this.loadAll(query),
    );
  }

  /**
   * Find all groups with optional filters and pagination
   * @param query - pagination and filter parameters
   */
  private async loadAll(query: QueryGroupDto) {
    const { subjectId, page = 1, limit = 20 } = query;

    const where: Prisma.GroupWhereInput = {};

    if (subjectId) {
      where.subjectGroups = {
        some: {
          subjectId,
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          faculty: {
            select: {
              id: true,
              name: true,
            },
          },
          // A count, not the students themselves: the list only shows how many there are
          _count: { select: { students: true } },
          subjectGroups: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: data.map(({ _count, ...group }) => ({ ...group, studentCount: _count.students })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get one group by ID (cached; a missing ID throws and is never cached)
   */
  async findOne(id: number) {
    return this.cache.getOrSet(DIRECTORY_NAMESPACE, `groups:one:${id}`, DIRECTORY_TTL_SECONDS, () =>
      this.loadOne(id),
    );
  }

  /**
   * Find group by ID
   */
  private async loadOne(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            studentId: true,
            course: true,
          },
        },
        subjectGroups: {
          include: {
            subject: {
              include: {
                teacherSubjects: {
                  include: {
                    teacher: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Группа с ID ${id} не найдена`);
    }

    return group;
  }

  /**
   * Update group
   */
  @InvalidatesCache()
  async update(id: number, dto: UpdateGroupDto) {
    // Check if group exists
    await this.loadOne(id);

    return this.prisma.group.update({
      where: { id },
      data: dto,
      include: {
        students: true,
        subjectGroups: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  /**
   * Get all subjects assigned to a group
   */
  async getSubjects(groupId: number) {
    await this.loadOne(groupId);

    const subjectGroups = await this.prisma.subjectGroup.findMany({
      where: { groupId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
            semester: true,
          },
        },
      },
    });

    return subjectGroups.map((sg) => sg.subject);
  }

  /**
   * Set subjects for a group (replaces all existing)
   */
  @InvalidatesCache()
  async setSubjects(groupId: number, subjectIds: number[]) {
    await this.loadOne(groupId);

    if (subjectIds.length > 0) {
      const subjects = await this.prisma.subject.findMany({
        where: { id: { in: subjectIds } },
      });

      if (subjects.length !== subjectIds.length) {
        throw new Error('Один или несколько предметов не найдены');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subjectGroup.deleteMany({ where: { groupId } });

      if (subjectIds.length > 0) {
        await tx.subjectGroup.createMany({
          data: subjectIds.map((subjectId) => ({ subjectId, groupId })),
        });
      }
    });

    return this.getSubjects(groupId);
  }

  /**
   * Delete group
   */
  @InvalidatesCache()
  async remove(id: number) {
    // Check if group exists
    await this.loadOne(id);

    await this.prisma.group.delete({
      where: { id },
    });

    return { message: 'Группа удалена' };
  }
}
