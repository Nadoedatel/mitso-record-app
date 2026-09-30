import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
    // Throttler module for rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (60 seconds)
        limit: 60, // Maximum number of requests per ttl window (default for all endpoints)
      },
    ]),
    // Database module (global)
    PrismaModule,
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
