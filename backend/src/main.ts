import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

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

  // Prefix, cookies, validation and exception filter (shared with e2e tests)
  configureApp(app);

  // Security headers. CSP is off outside production: Swagger UI uses inline scripts/styles
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
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
