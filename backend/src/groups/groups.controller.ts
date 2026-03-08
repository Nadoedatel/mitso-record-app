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
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, QueryGroupDto, SetGroupSubjectsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Role } from '@prisma/client';

/**
 * GroupsController - handles group-related endpoints
 * Base path: /api/groups
 */
@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  /**
   * Create new group
   * POST /api/groups
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new group (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  /**
   * Get all groups with optional filters and pagination
   * GET /api/groups?subjectId=1&page=1&limit=20
   */
  @Get()
  @ApiOperation({ summary: 'Get all groups with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
  findAll(@Query() query: QueryGroupDto) {
    return this.groupsService.findAll(query);
  }

  /**
   * Get group by ID
   * GET /api/groups/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiResponse({ status: 200, description: 'Group found' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  /**
   * Update group
   * PATCH /api/groups/:id
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update group (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Group updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, dto);
  }

  /**
   * Delete group
   * DELETE /api/groups/:id
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete group (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }

  /**
   * Get subjects assigned to a group
   * GET /api/groups/:id/subjects
   */
  @Get(':id/subjects')
  @ApiOperation({ summary: 'Get subjects assigned to a group' })
  @ApiResponse({ status: 200, description: 'Group subjects retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  getSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getSubjects(id);
  }

  /**
   * Set subjects for a group (replaces all existing)
   * POST /api/groups/:id/subjects
   */
  @Post(':id/subjects')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set subjects for a group - replaces all existing (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Subjects set successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group or subject not found' })
  setSubjects(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetGroupSubjectsDto,
  ) {
    return this.groupsService.setSubjects(id, dto.subjectIds);
  }
}
