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
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

/**
 * StudentsController - handles student-related endpoints
 * Base path: /api/students
 */
@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  /**
   * Create new student
   * POST /api/students
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  /**
   * Get all students with optional search and pagination
   * GET /api/students?search=name&page=1&limit=20
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get all students with search and pagination' })
  @ApiResponse({ status: 200, description: 'Students retrieved successfully' })
  findAll(@Query() query: QueryStudentDto) {
    return this.studentsService.findAll(query);
  }

  /**
   * Get student by ID
   * GET /api/students/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiResponse({ status: 200, description: 'Student found' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.studentsService.findOne(id, user);
  }

  /**
   * Update student
   * PATCH /api/students/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, dto);
  }

  /**
   * Delete student
   * DELETE /api/students/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
