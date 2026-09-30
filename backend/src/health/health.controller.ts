import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService, HealthStatus } from './health.service';

/**
 * HealthController - liveness endpoint for Docker/Render/monitoring
 * Base path: /api/health
 */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  /**
   * Check app and database health
   * GET /api/health
   */
  @Get()
  @ApiOperation({ summary: 'Health check (public)' })
  @ApiResponse({ status: 200, description: 'App and database are up' })
  @ApiResponse({ status: 503, description: 'Database is unreachable' })
  check(): Promise<HealthStatus> {
    return this.healthService.check();
  }
}
