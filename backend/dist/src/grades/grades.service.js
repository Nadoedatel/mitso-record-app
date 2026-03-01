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
exports.GradesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GradesService = class GradesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.grade.create({
            data: {
                ...dto,
                examDate: dto.examDate ? new Date(dto.examDate) : null,
            },
            include: {
                student: true,
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
        });
    }
    async findAll(query) {
        const { studentId, subjectId, page = 1, limit = 20 } = query;
        const where = {};
        if (studentId) {
            where.studentId = studentId;
        }
        if (subjectId) {
            where.subjectId = subjectId;
        }
        const [data, total] = await Promise.all([
            this.prisma.grade.findMany({
                where,
                include: {
                    student: true,
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
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.grade.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findByStudent(studentId) {
        return this.prisma.grade.findMany({
            where: { studentId },
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
            orderBy: [
                { subject: { semester: 'asc' } },
                { examDate: 'desc' },
            ],
        });
    }
    async findOne(id) {
        const grade = await this.prisma.grade.findUnique({
            where: { id },
            include: {
                student: true,
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
        });
        if (!grade) {
            throw new common_1.NotFoundException(`Grade with ID ${id} not found`);
        }
        return grade;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.grade.update({
            where: { id },
            data: {
                ...dto,
                examDate: dto.examDate ? new Date(dto.examDate) : undefined,
            },
            include: {
                student: true,
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
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.grade.delete({
            where: { id },
        });
        return { message: 'Grade deleted successfully' };
    }
    async findGroupsBySubject(subjectId) {
        const subjectGroups = await this.prisma.subjectGroup.findMany({
            where: { subjectId },
            include: {
                group: {
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
                            },
                        },
                    },
                },
            },
        });
        return subjectGroups.map((sg) => ({
            id: sg.group.id,
            name: sg.group.name,
            course: sg.group.course,
            facultyId: sg.group.facultyId,
            faculty: sg.group.faculty,
            studentCount: sg.group.students.length,
        }));
    }
    async findStudentsByGroupAndSubject(groupId, subjectId) {
        const students = await this.prisma.student.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        course: true,
                    },
                },
                grades: {
                    where: { subjectId },
                    include: {
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                    orderBy: {
                        examDate: 'desc',
                    },
                },
            },
            orderBy: {
                lastName: 'asc',
            },
        });
        return students;
    }
    async batchCreate(grades) {
        const results = await Promise.allSettled(grades.map((gradeDto) => this.prisma.grade.upsert({
            where: {
                studentId_subjectId_gradeType: {
                    studentId: gradeDto.studentId,
                    subjectId: gradeDto.subjectId,
                    gradeType: gradeDto.gradeType,
                },
            },
            create: {
                ...gradeDto,
                examDate: gradeDto.examDate ? new Date(gradeDto.examDate) : null,
            },
            update: {
                gradeValue: gradeDto.gradeValue,
                examDate: gradeDto.examDate ? new Date(gradeDto.examDate) : null,
                notes: gradeDto.notes,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        studentId: true,
                    },
                },
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        })));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected');
        return {
            total: grades.length,
            succeeded,
            failed: failed.length,
            errors: failed.map((f) => ({
                reason: f.status === 'rejected' ? f.reason.message : 'Unknown error',
            })),
            data: results
                .filter((r) => r.status === 'fulfilled')
                .map((r) => (r.status === 'fulfilled' ? r.value : null)),
        };
    }
};
exports.GradesService = GradesService;
exports.GradesService = GradesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GradesService);
//# sourceMappingURL=grades.service.js.map