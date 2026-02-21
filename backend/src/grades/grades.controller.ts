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
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

/**
 * GradesController - handles grade-related endpoints
 * Base path: /api/grades
 */
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
  create(@Body() dto: CreateGradeDto) {
    return this.gradesService.create(dto);
  }

  /**
   * Get all grades with optional filters
   * GET /api/grades?studentId=1&subjectId=2
   */
  @Get()
  findAll(
    @Query('studentId', new ParseIntPipe({ optional: true }))
    studentId?: number,
    @Query('subjectId', new ParseIntPipe({ optional: true }))
    subjectId?: number,
  ) {
    return this.gradesService.findAll(studentId, subjectId);
  }

  /**
   * Get grades for a specific student
   * GET /api/grades/student/:id
   * This is the key endpoint mentioned in API conventions
   */
  @Get('student/:id')
  findByStudent(@Param('id', ParseIntPipe) studentId: number) {
    return this.gradesService.findByStudent(studentId);
  }

  /**
   * Get grade by ID
   * GET /api/grades/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.findOne(id);
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
  ) {
    return this.gradesService.update(id, dto);
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
