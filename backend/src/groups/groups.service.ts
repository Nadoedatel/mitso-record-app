import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, QueryGroupDto } from './dto';
import { PaginatedResponse } from '../common/dto';

/**
 * GroupsService - business logic for group management
 */
@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new group
   */
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
   * Find all groups with optional filters and pagination
   * @param query - pagination and filter parameters
   */
  async findAll(query: QueryGroupDto): Promise<PaginatedResponse<any>> {
    const { subjectId, page = 1, limit = 20 } = query;

    const where: any = {};

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
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find group by ID
   */
  async findOne(id: number) {
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
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  /**
   * Update group
   */
  async update(id: number, dto: UpdateGroupDto) {
    // Check if group exists
    await this.findOne(id);

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
   * Delete group
   */
  async remove(id: number) {
    // Check if group exists
    await this.findOne(id);

    await this.prisma.group.delete({
      where: { id },
    });

    return { message: 'Group deleted successfully' };
  }
}
