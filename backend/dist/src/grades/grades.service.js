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
                        teacher: true,
                    },
                },
            },
        });
    }
    async findAll(studentId, subjectId) {
        const where = {};
        if (studentId) {
            where.studentId = studentId;
        }
        if (subjectId) {
            where.subjectId = subjectId;
        }
        return this.prisma.grade.findMany({
            where,
            include: {
                student: true,
                subject: {
                    include: {
                        teacher: true,
                    },
                },
            },
            orderBy: {
                examDate: 'desc',
            },
        });
    }
    async findByStudent(studentId) {
        return this.prisma.grade.findMany({
            where: { studentId },
            include: {
                subject: {
                    include: {
                        teacher: true,
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
                        teacher: true,
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
                        teacher: true,
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
};
exports.GradesService = GradesService;
exports.GradesService = GradesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GradesService);
//# sourceMappingURL=grades.service.js.map