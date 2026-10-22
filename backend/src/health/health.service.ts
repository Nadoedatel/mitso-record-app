import { Injectable } from '@nestjs/common';
import { UnavailableError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
  uptime: number;
  timestamp: string;
}

/**
 * HealthService - checks that the app and its database are alive
 */
@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ping database and return current health status
   * @throws UnavailableError if database is unreachable
   */
  async check(): Promise<HealthStatus> {
    try {
      // Minimal ping: the only way to check DB connectivity without touching tables
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new UnavailableError('База данных недоступна');
    }

    return {
      status: 'ok',
      database: 'up',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
