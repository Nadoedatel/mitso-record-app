import { Module } from '@nestjs/common';
import { StudentsModule } from '../students';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsWorker } from './jobs.worker';

/**
 * JobsModule - background jobs on BullMQ (Redis): record book export and student import.
 * Needs REDIS_URL; without it the endpoints answer 503 and no worker starts.
 */
@Module({
  imports: [StudentsModule],
  controllers: [JobsController],
  providers: [JobsService, JobsWorker],
})
export class JobsModule {}
