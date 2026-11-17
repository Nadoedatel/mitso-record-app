import { Module } from '@nestjs/common';
import { StudentsModule } from '../students';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

/**
 * JobsModule - background jobs on BullMQ (Redis): record book export and student import.
 * Needs REDIS_URL; without it the endpoints answer 503. Processing runs in WorkerModule.
 */
@Module({
  imports: [StudentsModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
