import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { GradesRepository } from './grades.repository';
import { AuditModule } from '../audit';

/**
 * GradesModule - manages grade-related functionality
 */
@Module({
  imports: [AuditModule],
  controllers: [GradesController],
  providers: [GradesService, GradesRepository],
  exports: [GradesService],
})
export class GradesModule {}
