import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { AuditLogListResponseDto } from '../common/dto';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto';

/**
 * AuditController - read access to the audit log
 * Base path: /api/audit-log
 */
@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private auditService: AuditService) {}

  /**
   * Who changed which grade, newest first
   * GET /api/audit-log?studentId=1&action=GRADE_UPDATE&from=2026-10-01&limit=20&cursor=...
   */
  @Get()
  @ApiOperation({ summary: 'Audit log of grade changes (ADMIN only)' })
  @ApiResponse({ status: 200, type: AuditLogListResponseDto, description: 'Records retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: QueryAuditDto) {
    return this.auditService.findAll(query);
  }
}
