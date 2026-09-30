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
import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto, AssignSubjectsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

/**
 * TeachersController - handles teacher-related endpoints
 * Base path: /api/teachers
 */
@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  /**
   * Create new teacher
   * POST /api/teachers
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  /**
   * Get all teachers with optional search and pagination
   * GET /api/teachers?search=name&page=1&limit=20
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get all teachers with search and pagination' })
  @ApiResponse({ status: 200, description: 'Teachers retrieved successfully' })
  findAll(@Query() query: QueryTeacherDto) {
    return this.teachersService.findAll(query);
  }

  /**
   * Get teacher by ID
   * GET /api/teachers/:id
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiResponse({ status: 200, description: 'Teacher found' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  /**
   * Update teacher
   * PATCH /api/teachers/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(id, dto);
  }

  /**
   * Delete teacher
   * DELETE /api/teachers/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }

  /**
   * Get subjects for a teacher
   * GET /api/teachers/:id/subjects
   */
  @Get(':id/subjects')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get subjects for a teacher' })
  @ApiResponse({ status: 200, description: 'Teacher subjects retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  getSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.getSubjects(id);
  }

  /**
   * Set subjects for a teacher (replaces all existing)
   * POST /api/teachers/:id/subjects
   */
  @Post(':id/subjects')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set subjects for a teacher - replaces all existing (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Subjects set successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Teacher or subject not found' })
  setSubjects(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignSubjectsDto,
  ) {
    return this.teachersService.setSubjects(id, dto.subjectIds);
  }

  /**
   * Remove a subject from a teacher
   * DELETE /api/teachers/:id/subjects/:subjectId
   */
  @Delete(':id/subjects/:subjectId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove subject from teacher (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Subject removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Teacher or assignment not found' })
  removeSubject(
    @Param('id', ParseIntPipe) id: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.teachersService.removeSubject(id, subjectId);
  }
}
