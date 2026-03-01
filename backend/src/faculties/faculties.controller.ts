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
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto, UpdateFacultyDto, QueryFacultyDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

/**
 * FacultiesController - handles faculty-related endpoints
 * Base path: /api/faculties
 */
@ApiTags('faculties')
@ApiBearerAuth()
@Controller('faculties')
@UseGuards(JwtAuthGuard)
export class FacultiesController {
  constructor(private facultiesService: FacultiesService) {}

  /**
   * Create new faculty
   * POST /api/faculties
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new faculty (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Faculty created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateFacultyDto) {
    return this.facultiesService.create(dto);
  }

  /**
   * Get all faculties with optional search and pagination
   * GET /api/faculties?search=name&page=1&limit=20
   */
  @Get()
  @ApiOperation({ summary: 'Get all faculties with search and pagination' })
  @ApiResponse({ status: 200, description: 'Faculties retrieved successfully' })
  findAll(@Query() query: QueryFacultyDto) {
    return this.facultiesService.findAll(query);
  }

  /**
   * Get faculty by ID
   * GET /api/faculties/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get faculty by ID with specializations and groups' })
  @ApiResponse({ status: 200, description: 'Faculty found' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.findOne(id);
  }

  /**
   * Update faculty
   * PATCH /api/faculties/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update faculty (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Faculty updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFacultyDto,
  ) {
    return this.facultiesService.update(id, dto);
  }

  /**
   * Delete faculty
   * DELETE /api/faculties/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete faculty (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Faculty deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.facultiesService.remove(id);
  }
}
