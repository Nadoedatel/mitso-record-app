// Must stay first: starts Sentry before other modules are loaded (no-op without SENTRY_DSN)
import './instrument';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { assertJwtSecrets } from './auth/jwt-secrets';

/**
 * Bootstrap function - initializes and starts the application
 */
async function bootstrap() {
  // Refuse to start with missing, short, placeholder or shared JWT secrets
  assertJwtSecrets(process.env);

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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    // The browser hides non-standard response headers from another origin unless exposed.
    // The frontend reads x-request-id to show/report it with an error.
    exposedHeaders: ['x-request-id'],
  });

  // Swagger API documentation (dev only)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('MITSO Record App API')
      .setDescription('API for student record management system')
      .setVersion('2.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('students', 'Student management endpoints')
      .addTag('teachers', 'Teacher management endpoints')
      .addTag('subjects', 'Subject management endpoints')
      .addTag('grades', 'Grade management endpoints')
      .addTag('health', 'Health check')
      .addBearerAuth()
      .build();

    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
