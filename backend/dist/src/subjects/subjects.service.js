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
                teacher: true,
            },
        });
    }
    async findAll(teacherId, semester) {
        const where = {};
        if (teacherId) {
            where.teacherId = teacherId;
        }
        if (semester) {
            where.semester = semester;
        }
        return this.prisma.subject.findMany({
            where,
            include: {
                teacher: true,
                grades: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }
    async findOne(id) {
        const subject = await this.prisma.subject.findUnique({
            where: { id },
            include: {
                teacher: true,
                grades: {
                    include: {
                        student: true,
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
                teacher: true,
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
};
exports.SubjectsService = SubjectsService;
exports.SubjectsService = SubjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubjectsService);
//# sourceMappingURL=subjects.service.js.map