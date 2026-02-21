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
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

/**
 * SubjectsController - handles subject-related endpoints
 * Base path: /api/subjects
 */
@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  /**
   * Create new subject
   * POST /api/subjects
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  /**
   * Get all subjects with optional filters
   * GET /api/subjects?teacherId=1&semester=3
   */
  @Get()
  findAll(
    @Query('teacherId') teacherId?: string,
    @Query('semester') semester?: string,
  ) {
    const teacherIdNum = teacherId ? parseInt(teacherId, 10) : undefined;
    const semesterNum = semester ? parseInt(semester, 10) : undefined;
    return this.subjectsService.findAll(teacherIdNum, semesterNum);
  }

  /**
   * Get subject by ID
   * GET /api/subjects/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  /**
   * Update subject
   * PATCH /api/subjects/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, dto);
  }

  /**
   * Delete subject
   * DELETE /api/subjects/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}
