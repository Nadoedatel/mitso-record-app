import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradesModule } from './grades/grades.module';
import { GroupsModule } from './groups/groups.module';
import { FacultiesModule } from './faculties/faculties.module';
import { SpecializationsModule } from './specializations/specializations.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './cache';
import { THROTTLER_STORAGE, ThrottlingModule } from './throttling';
import { LoggerModule } from 'nestjs-pino';
import { buildLoggerParams } from './common/logger/logger.config';

/**
 * AppModule - root application module
 * Imports all feature modules and configures global settings
 */
@Module({
  imports: [
    // Configuration module (loads .env file)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Structured request logging (pino): JSON in production, request id on every line
    LoggerModule.forRoot(buildLoggerParams()),
    // Throttler module for rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ThrottlingModule],
      inject: [THROTTLER_STORAGE],
      useFactory: (storage: ThrottlerStorage | undefined) => ({
        throttlers: [
          {
            ttl: 60000, // Time window in milliseconds (60 seconds)
            limit: 60, // Maximum number of requests per ttl window (default for all endpoints)
          },
        ],
        // Shared counters in Redis when REDIS_URL is set, per-process memory otherwise
        storage,
      }),
    }),
    // Database module (global)
    PrismaModule,
    // Cache (global): Redis when REDIS_URL is set, memory otherwise
    CacheModule,
    // Feature modules
    AuthModule,
    StudentsModule,
    TeachersModule,
    SubjectsModule,
    GradesModule,
    GroupsModule,
    FacultiesModule,
    SpecializationsModule,
    HealthModule,
  ],
  providers: [
    // Global throttler guard for rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
