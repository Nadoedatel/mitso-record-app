import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import * as cookieParser from 'cookie-parser';
import { z } from 'zod';
import { AllExceptionsFilter } from './common/filters';
import { parseTrustProxy } from './common/config';

// Zod's built-in Russian texts for validation errors ("Неверный ввод: ожидалось число...")
z.config(z.locales.ru());

/**
 * Applies the HTTP-level configuration that changes request/response behavior.
 * Shared by main.ts and e2e tests so tests exercise the same pipeline as production.
 */
export function configureApp(app: INestApplication): void {
  // Real client IP behind a proxy (for the rate limiter and logs); off unless TRUST_PROXY is set
  app.getHttpAdapter().getInstance().set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Validation: every DTO is a Zod schema (see dto/ folders)
  app.useGlobalPipes(new ZodValidationPipe());

  // Global exception filter (handles HTTP exceptions + Prisma errors)
  app.useGlobalFilters(new AllExceptionsFilter());
}
