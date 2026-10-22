// Must stay first: starts Sentry before other modules are loaded (no-op without SENTRY_DSN)
import './instrument';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './openapi';
import { configureApp } from './app.setup';
import { getAllowedOrigins } from './common/config';
import { assertJwtSecrets } from './auth/jwt-secrets';
import { loadEncryptionKey } from './auth/two-factor/totp-crypto';

/**
 * Bootstrap function - initializes and starts the application
 */
async function bootstrap() {
  // Refuse to start with missing, short, placeholder or shared JWT secrets
  assertJwtSecrets(process.env);
  // A malformed TOTP key fails here, not at the first admin who enables two-factor; a missing one only turns the feature off
  const twoFactorAvailable = loadEncryptionKey() !== null;

  // bufferLogs: hold early Nest logs until pino is attached, so every line has the same format
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(PinoLogger);
  app.useLogger(logger);

  // Prefix, cookies, validation and exception filter (shared with e2e tests)
  configureApp(app);

  // Security headers. CSP is off outside production: Swagger UI uses inline scripts/styles
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  // Enable CORS
  app.enableCors({
    origin: getAllowedOrigins(process.env),
    credentials: true,
    // The browser hides non-standard response headers from another origin unless exposed.
    // The frontend reads x-request-id to show/report it with an error.
    exposedHeaders: ['x-request-id'],
  });

  // Swagger API documentation (dev only)
  if (!isProduction) {
    const document = buildOpenApiDocument(app);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  if (!twoFactorAvailable) logger.warn('Two-factor login is off: TOTP_ENCRYPTION_KEY is not set');
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
