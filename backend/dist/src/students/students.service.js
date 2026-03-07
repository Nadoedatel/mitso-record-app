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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.student.create({
            data: {
                ...dto,
                birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
            },
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
        const { search, groupId, page = 1, limit = 20 } = query;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { studentId: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (groupId) {
            where.groupId = groupId;
        }
        const [data, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                            course: true,
                            faculty: true,
                        },
                    },
                },
                orderBy: {
                    lastName: 'asc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.student.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
        });
        if (!student) {
            throw new common_1.NotFoundException(`Student with ID ${id} not found`);
        }
        return student;
    }
    async findOne(id, user) {
        if (user.role === client_1.Role.STUDENT) {
            const ownStudent = await this.prisma.student.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });
            if (!ownStudent || ownStudent.id !== id) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        course: true,
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                specialization: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                grades: {
                    include: {
                        subject: {
                            include: {
                                teacherSubjects: {
                                    include: {
                                        teacher: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        examDate: 'desc',
                    },
                },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException(`Student with ID ${id} not found`);
        }
        return student;
    }
    async findByUserId(userId) {
        const student = await this.prisma.student.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        course: true,
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                specialization: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!student) {
            throw new common_1.NotFoundException(`Student for user ${userId} not found`);
        }
        return student;
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.student.update({
            where: { id },
            data: {
                ...dto,
                birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        course: true,
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                specialization: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        faculty: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.student.delete({
            where: { id },
        });
        return { message: 'Student deleted successfully' };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map