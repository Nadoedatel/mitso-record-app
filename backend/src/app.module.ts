import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradesModule } from './grades/grades.module';

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
    // Database module (global)
    PrismaModule,
    // Feature modules
    AuthModule,
    StudentsModule,
    TeachersModule,
    SubjectsModule,
    GradesModule,
  ],
})
export class AppModule {}
