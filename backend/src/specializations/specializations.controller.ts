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
import { SpecializationsService } from './specializations.service';
import {
  CreateSpecializationDto,
  UpdateSpecializationDto,
  QuerySpecializationDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

/**
 * SpecializationsController - handles specialization-related endpoints
 * Base path: /api/specializations
 */
@ApiTags('specializations')
@ApiBearerAuth()
@Controller('specializations')
@UseGuards(JwtAuthGuard)
export class SpecializationsController {
  constructor(private specializationsService: SpecializationsService) {}

  /**
   * Create new specialization
   * POST /api/specializations
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new specialization (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Specialization created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateSpecializationDto) {
    return this.specializationsService.create(dto);
  }

  /**
   * Get all specializations with optional filters
   * GET /api/specializations?facultyId=1&search=name&page=1&limit=20
   */
  @Get()
  @ApiOperation({ summary: 'Get all specializations with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Specializations retrieved successfully' })
  findAll(@Query() query: QuerySpecializationDto) {
    return this.specializationsService.findAll(query);
  }

  /**
   * Get specialization by ID
   * GET /api/specializations/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get specialization by ID' })
  @ApiResponse({ status: 200, description: 'Specialization found' })
  @ApiResponse({ status: 404, description: 'Specialization not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.specializationsService.findOne(id);
  }

  /**
   * Update specialization
   * PATCH /api/specializations/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update specialization (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Specialization updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Specialization not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecializationDto,
  ) {
    return this.specializationsService.update(id, dto);
  }

  /**
   * Delete specialization
   * DELETE /api/specializations/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete specialization (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Specialization deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Specialization not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.specializationsService.remove(id);
  }
}
