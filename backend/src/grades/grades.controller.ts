import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto, BatchCreateGradeDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

/**
 * GradesController - handles grade-related endpoints
 * Base path: /api/grades
 */
@ApiTags('grades')
@ApiBearerAuth()
@Controller('grades')
@UseGuards(JwtAuthGuard)
export class GradesController {
  constructor(private gradesService: GradesService) {}

  /**
   * Create new grade
   * POST /api/grades
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Create new grade (ADMIN/TEACHER only)' })
  @ApiResponse({ status: 201, description: 'Grade created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateGradeDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.create(dto, user);
  }

  /**
   * Batch create or update grades
   * POST /api/grades/batch
   */
  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Batch create or update grades (ADMIN/TEACHER only)' })
  @ApiResponse({ status: 201, description: 'Grades processed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  batchCreate(@Body() dto: BatchCreateGradeDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.batchCreate(dto.grades, user);
  }

  /**
   * Get all grades with optional filters and pagination
   * GET /api/grades?studentId=1&subjectId=2&page=1&limit=20
   */
  @Get()
  @ApiOperation({ summary: 'Get all grades with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Grades retrieved successfully' })
  findAll(@Query() query: QueryGradeDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.findAll(query, user);
  }

  /**
   * Get grades for a specific student
   * GET /api/grades/student/:id
   * This is the key endpoint mentioned in API conventions
   */
  @Get('student/:id')
  @ApiOperation({ summary: 'Get all grades for a specific student' })
  @ApiResponse({ status: 200, description: 'Student grades retrieved successfully' })
  findByStudent(
    @Param('id', ParseIntPipe) studentId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.findByStudent(studentId, user);
  }

  /**
   * Get groups for a specific subject
   * GET /api/grades/subject/:subjectId/groups
   */
  @Get('subject/:subjectId/groups')
  @ApiOperation({ summary: 'Get groups assigned to a specific subject' })
  @ApiResponse({ status: 200, description: 'Subject groups retrieved successfully' })
  findGroupsBySubject(@Param('subjectId', ParseIntPipe) subjectId: number) {
    return this.gradesService.findGroupsBySubject(subjectId);
  }

  /**
   * Get students for a specific group and subject
   * GET /api/grades/subject/:subjectId/group/:groupId/students
   */
  @Get('subject/:subjectId/group/:groupId/students')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get students for a specific group and subject with their grades' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  findStudentsByGroupAndSubject(
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.findStudentsByGroupAndSubject(groupId, subjectId, user);
  }

  /**
   * Get grade by ID
   * GET /api/grades/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get grade by ID' })
  @ApiResponse({ status: 200, description: 'Grade found' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.gradesService.findOne(id, user);
  }

  /**
   * Update grade
   * PATCH /api/grades/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.update(id, dto, user);
  }

  /**
   * Delete grade
   * DELETE /api/grades/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.remove(id);
  }
}
