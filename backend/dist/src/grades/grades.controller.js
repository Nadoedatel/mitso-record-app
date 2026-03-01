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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const grades_service_1 = require("./grades.service");
const dto_1 = require("./dto");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const client_1 = require("@prisma/client");
let GradesController = class GradesController {
    constructor(gradesService) {
        this.gradesService = gradesService;
    }
    create(dto) {
        return this.gradesService.create(dto);
    }
    batchCreate(dto) {
        return this.gradesService.batchCreate(dto.grades);
    }
    findAll(query) {
        return this.gradesService.findAll(query);
    }
    findByStudent(studentId) {
        return this.gradesService.findByStudent(studentId);
    }
    findGroupsBySubject(subjectId) {
        return this.gradesService.findGroupsBySubject(subjectId);
    }
    findStudentsByGroupAndSubject(subjectId, groupId) {
        return this.gradesService.findStudentsByGroupAndSubject(groupId, subjectId);
    }
    findOne(id) {
        return this.gradesService.findOne(id);
    }
    update(id, dto) {
        return this.gradesService.update(id, dto);
    }
    remove(id) {
        return this.gradesService.remove(id);
    }
};
exports.GradesController = GradesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.TEACHER),
    (0, swagger_1.ApiOperation)({ summary: 'Create new grade (ADMIN/TEACHER only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Grade created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateGradeDto]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.TEACHER),
    (0, swagger_1.ApiOperation)({ summary: 'Batch create or update grades (ADMIN/TEACHER only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Grades processed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BatchCreateGradeDto]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "batchCreate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all grades with filters and pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grades retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryGradeDto]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('student/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all grades for a specific student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student grades retrieved successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "findByStudent", null);
__decorate([
    (0, common_1.Get)('subject/:subjectId/groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Get groups assigned to a specific subject' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subject groups retrieved successfully' }),
    __param(0, (0, common_1.Param)('subjectId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "findGroupsBySubject", null);
__decorate([
    (0, common_1.Get)('subject/:subjectId/group/:groupId/students'),
    (0, swagger_1.ApiOperation)({ summary: 'Get students for a specific group and subject with their grades' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Students retrieved successfully' }),
    __param(0, (0, common_1.Param)('subjectId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "findStudentsByGroupAndSubject", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get grade by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grade found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Grade not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.TEACHER),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.UpdateGradeDto]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], GradesController.prototype, "remove", null);
exports.GradesController = GradesController = __decorate([
    (0, swagger_1.ApiTags)('grades'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('grades'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __metadata("design:paramtypes", [grades_service_1.GradesService])
], GradesController);
//# sourceMappingURL=grades.controller.js.map