import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

/**
 * Bootstrap function - initializes and starts the application
 */
async function bootstrap() {
  // Validate required secrets before starting
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables',
    );
  }

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Security headers. CSP is off outside production: Swagger UI uses inline scripts/styles
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  // Enable cookie parser for httpOnly cookies
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

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

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  const port = process.env.PORT || 8080;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
