import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { reportError } from '../monitoring/error-reporter';

/**
 * HttpExceptionFilter - global exception filter
 * Formats all HTTP exceptions to a consistent response structure
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as object);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...error,
    });
  }
}

/**
 * AllExceptionsFilter - catches all exceptions (including non-HTTP and Prisma errors)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly fallbackLogger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AppRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof ZodValidationException) {
      // Same shape as class-validator had: an array of "field: problem" strings
      status = exception.getStatus();
      const zodError = exception.getZodError();
      message =
        zodError instanceof ZodError
          ? zodError.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
          : 'Validation failed';
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message ?? message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Запись с таким значением уже существует (поле: ${(exception.meta?.target as string[])?.join(', ')})`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Запись не найдена';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Нарушение внешнего ключа';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Database error: ${exception.code}`;
      }
    }

    // The client only ever sees a generic message for 5xx, so the real cause must be logged here.
    // Expected 4xx are not logged by the filter (the request logger already records them as warnings).
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logFailure(exception, request);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }

  /**
   * Log an unexpected failure with its stack. Uses the per-request pino logger when present,
   * so the line carries the request id; falls back to the Nest logger otherwise.
   * Then forwards the error to the monitoring service (a no-op when none is configured).
   */
  private logFailure(exception: unknown, request: AppRequest): void {
    const error = exception instanceof Error ? exception : new Error(String(exception));
    if (request.log) {
      request.log.error({ err: error }, `Unhandled exception: ${error.message}`);
    } else {
      this.fallbackLogger.error(error.message, error.stack);
    }

    reportError(error, {
      requestId: request.id === undefined ? undefined : String(request.id),
      userId: request.user?.id,
      method: request.method,
      url: request.url,
    });
  }
}

/** Express request plus what pino-http (`log`, `id`) and the JWT guard (`user`) attach to it */
type AppRequest = Request & { log?: RequestLogger; id?: string | number; user?: { id?: number } };

/** The slice of pino's per-request logger this filter needs */
interface RequestLogger {
  error(obj: { err: Error }, message: string): void;
}
