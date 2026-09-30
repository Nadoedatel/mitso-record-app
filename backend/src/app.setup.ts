import { INestApplication, ValidationPipe } from '@nestjs/common';
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

  // Global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // Global exception filter (handles HTTP exceptions + Prisma errors)
  app.useGlobalFilters(new AllExceptionsFilter());
}
