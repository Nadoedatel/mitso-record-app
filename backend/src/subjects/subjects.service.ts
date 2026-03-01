import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto, QuerySubjectDto } from './dto';
import { PaginatedResponse } from '../common/dto';

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
        teacherSubjects: {
          include: {
            teacher: true,
          },
        },
        subjectGroups: {
          include: {
            group: true,
          },
        },
      },
    });
  }

  /**
   * Find all subjects with optional filters and pagination
   */
  async findAll(query: QuerySubjectDto): Promise<PaginatedResponse<any>> {
    const { teacherId, semester, page = 1, limit = 20 } = query;

    const where: any = {};

    if (teacherId) {
      where.teacherSubjects = {
        some: {
          teacherId,
        },
      };
    }

    if (semester) {
      where.semester = semester;
    }

    const [data, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        include: {
          teacherSubjects: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  department: true,
                },
              },
            },
          },
          subjectGroups: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  course: true,
                },
              },
            },
          },
          grades: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subject.count({ where }),
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
   * Find subject by ID
   */
  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teacherSubjects: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                department: true,
                position: true,
              },
            },
          },
        },
        subjectGroups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                course: true,
                faculty: true,
              },
            },
          },
        },
        grades: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
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
        teacherSubjects: {
          include: {
            teacher: true,
          },
        },
        subjectGroups: {
          include: {
            group: true,
          },
        },
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

  /**
   * Assign groups to a subject
   */
  async assignGroups(subjectId: number, groupIds: number[]) {
    // Check if subject exists
    await this.findOne(subjectId);

    // Check if all groups exist
    const groups = await this.prisma.group.findMany({
      where: { id: { in: groupIds } },
    });

    if (groups.length !== groupIds.length) {
      throw new NotFoundException('One or more groups not found');
    }

    // Create subject-group relations (ignore duplicates)
    const createPromises = groupIds.map((groupId) =>
      this.prisma.subjectGroup.upsert({
        where: {
          subjectId_groupId: {
            subjectId,
            groupId,
          },
        },
        create: {
          subjectId,
          groupId,
        },
        update: {},
      }),
    );

    await Promise.all(createPromises);

    // Return updated subject with groups
    return this.findOne(subjectId);
  }
}
