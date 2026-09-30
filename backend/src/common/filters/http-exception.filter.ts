import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

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
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
