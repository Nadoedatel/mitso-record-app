"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubjectsService = class SubjectsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
    async findAll(query) {
        const { teacherId, semester, page = 1, limit = 20 } = query;
        const where = {};
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Subject with ID ${id} not found`);
        }
        return subject;
    }
    async update(id, dto) {
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
    async remove(id) {
        await this.findOne(id);
        await this.prisma.subject.delete({
            where: { id },
        });
        return { message: 'Subject deleted successfully' };
    }
    async assignGroups(subjectId, groupIds) {
        await this.findOne(subjectId);
        const groups = await this.prisma.group.findMany({
            where: { id: { in: groupIds } },
        });
        if (groups.length !== groupIds.length) {
            throw new common_1.NotFoundException('One or more groups not found');
        }
        const createPromises = groupIds.map((groupId) => this.prisma.subjectGroup.upsert({
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
        }));
        await Promise.all(createPromises);
        return this.findOne(subjectId);
    }
    async getTeachers(subjectId) {
        await this.findOne(subjectId);
        const teacherSubjects = await this.prisma.teacherSubject.findMany({
            where: { subjectId },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });
        return teacherSubjects.map((ts) => ts.teacher);
    }
    async setTeachers(subjectId, teacherIds) {
        await this.findOne(subjectId);
        const teachers = await this.prisma.teacher.findMany({
            where: { id: { in: teacherIds } },
        });
        if (teachers.length !== teacherIds.length) {
            throw new common_1.NotFoundException('One or more teachers not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.teacherSubject.deleteMany({
                where: { subjectId },
            });
            if (teacherIds.length > 0) {
                await tx.teacherSubject.createMany({
                    data: teacherIds.map((teacherId) => ({
                        teacherId,
                        subjectId,
                    })),
                });
            }
        });
        return this.getTeachers(subjectId);
    }
};
exports.SubjectsService = SubjectsService;
exports.SubjectsService = SubjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubjectsService);
//# sourceMappingURL=subjects.service.js.map