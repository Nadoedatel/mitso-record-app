import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters';

/**
 * Applies the HTTP-level configuration that changes request/response behavior.
 * Shared by main.ts and e2e tests so tests exercise the same pipeline as production.
 */
export function configureApp(app: INestApplication): void {
  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Validation: every DTO is a Zod schema (see dto/ folders)
  app.useGlobalPipes(new ZodValidationPipe());

  // Global exception filter (handles HTTP exceptions + Prisma errors)
  app.useGlobalFilters(new AllExceptionsFilter());
}
