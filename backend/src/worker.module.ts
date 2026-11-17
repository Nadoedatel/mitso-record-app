import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from './cache';
import { JobsService } from './jobs/jobs.service';
import { JobsWorker } from './jobs/jobs.worker';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';

/** Dependencies needed to consume background jobs, without starting the HTTP API. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, CacheModule, StudentsModule],
  providers: [JobsService, JobsWorker],
})
export class WorkerModule {}
