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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TeachersService = class TeachersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
    async findAll(query) {
        const { search, page = 1, limit = 20 } = query;
        const where = search
            ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { department: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [data, total] = await Promise.all([
            this.prisma.teacher.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                    teacherSubjects: {
                        include: {
                            subject: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    semester: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    lastName: 'asc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.teacher.count({ where }),
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
                teacherSubjects: {
                    include: {
                        subject: {
                            include: {
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
                                subjectGroups: {
                                    include: {
                                        group: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!teacher) {
            throw new common_1.NotFoundException(`Teacher with ID ${id} not found`);
        }
        return teacher;
    }
    async findByUserId(userId) {
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
                teacherSubjects: {
                    include: {
                        subject: true,
                    },
                },
            },
        });
        if (!teacher) {
            throw new common_1.NotFoundException(`Teacher for user ${userId} not found`);
        }
        return teacher;
    }
    async update(id, dto) {
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
    async remove(id) {
        await this.findOne(id);
        await this.prisma.teacher.delete({
            where: { id },
        });
        return { message: 'Teacher deleted successfully' };
    }
    async getSubjects(teacherId) {
        await this.findOne(teacherId);
        const teacherSubjects = await this.prisma.teacherSubject.findMany({
            where: { teacherId },
            include: {
                subject: {
                    include: {
                        grades: {
                            select: {
                                id: true,
                                gradeValue: true,
                                gradeType: true,
                            },
                        },
                        subjectGroups: {
                            include: {
                                group: true,
                            },
                        },
                    },
                },
            },
        });
        return teacherSubjects.map((ts) => ts.subject);
    }
    async assignSubjects(teacherId, subjectIds) {
        await this.findOne(teacherId);
        const subjects = await this.prisma.subject.findMany({
            where: { id: { in: subjectIds } },
        });
        if (subjects.length !== subjectIds.length) {
            throw new common_1.NotFoundException('One or more subjects not found');
        }
        const createPromises = subjectIds.map((subjectId) => this.prisma.teacherSubject.upsert({
            where: {
                teacherId_subjectId: {
                    teacherId,
                    subjectId,
                },
            },
            create: {
                teacherId,
                subjectId,
            },
            update: {},
        }));
        await Promise.all(createPromises);
        return this.getSubjects(teacherId);
    }
    async removeSubject(teacherId, subjectId) {
        await this.findOne(teacherId);
        const deleted = await this.prisma.teacherSubject.deleteMany({
            where: {
                teacherId,
                subjectId,
            },
        });
        if (deleted.count === 0) {
            throw new common_1.NotFoundException(`Teacher ${teacherId} is not assigned to subject ${subjectId}`);
        }
        return { message: 'Subject removed from teacher successfully' };
    }
    async setSubjects(teacherId, subjectIds) {
        await this.findOne(teacherId);
        const subjects = await this.prisma.subject.findMany({
            where: { id: { in: subjectIds } },
        });
        if (subjects.length !== subjectIds.length) {
            throw new common_1.NotFoundException('One or more subjects not found');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.teacherSubject.deleteMany({
                where: { teacherId },
            });
            if (subjectIds.length > 0) {
                await tx.teacherSubject.createMany({
                    data: subjectIds.map((subjectId) => ({
                        teacherId,
                        subjectId,
                    })),
                });
            }
        });
        return this.getSubjects(teacherId);
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map