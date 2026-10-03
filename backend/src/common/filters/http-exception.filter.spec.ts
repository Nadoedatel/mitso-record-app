import { ArgumentsHost, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './http-exception.filter';
import { resetErrorReporter, setErrorReporter } from '../monitoring/error-reporter';

describe('AllExceptionsFilter logging', () => {
  const filter = new AllExceptionsFilter();
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const reqLog = { error: jest.fn() };

  /** Minimal ArgumentsHost exposing a request (optionally with a pino `log`) and a response */
  const host = (withRequestLogger = true): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          id: 'req-1',
          method: 'GET',
          url: '/api/x',
          user: { id: 9 },
          ...(withRequestLogger ? { log: reqLog } : {}),
        }),
      }),
    }) as unknown as ArgumentsHost;

  const body = () => json.mock.calls[0][0];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetErrorReporter();
  });

  describe('error reporting', () => {
    const capture = jest.fn();

    beforeEach(() => setErrorReporter({ capture }));

    it('reports an unexpected error with the request context', () => {
      const boom = new Error('boom');

      filter.catch(boom, host());

      expect(capture).toHaveBeenCalledWith(boom, { requestId: 'req-1', userId: 9, method: 'GET', url: '/api/x' });
    });

    it.each([
      ['a 404', new NotFoundException('nope')],
      ['a 400', new BadRequestException('bad')],
    ])('does not report %s (expected client mistakes)', (_label, exception) => {
      filter.catch(exception, host());

      expect(capture).not.toHaveBeenCalled();
    });

    it('still answers the client when the reporter itself fails', () => {
      capture.mockImplementation(() => {
        throw new Error('sentry is down');
      });

      filter.catch(new Error('boom'), host());

      expect(status).toHaveBeenCalledWith(500);
      expect(body().message).toBe('Internal server error');
    });
  });

  it('logs an unexpected error with its stack, and hides the cause from the client', () => {
    const boom = new Error('connection string postgres://user:pass@db leaked');

    filter.catch(boom, host());

    expect(reqLog.error).toHaveBeenCalledWith({ err: boom }, expect.stringContaining('Unhandled exception'));
    expect(status).toHaveBeenCalledWith(500);
    expect(body().message).toBe('Internal server error');
    expect(JSON.stringify(body())).not.toContain('postgres://');
  });

  it('logs an unmapped Prisma error code as a 500', () => {
    const error = new Prisma.PrismaClientKnownRequestError('boom', { code: 'P9999', clientVersion: 'x' });

    filter.catch(error, host());

    expect(status).toHaveBeenCalledWith(500);
    expect(reqLog.error).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a 404', new NotFoundException('nope'), 404],
    ['a 400', new BadRequestException('bad'), 400],
    [
      'a unique-constraint violation',
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x', meta: { target: ['email'] } }),
      409,
    ],
  ])('does not log %s as an error', (_label, exception, expectedStatus) => {
    filter.catch(exception, host());

    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(reqLog.error).not.toHaveBeenCalled();
    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });

  it('falls back to the Nest logger when the request has no pino logger', () => {
    filter.catch(new Error('boom'), host(false));

    expect(Logger.prototype.error).toHaveBeenCalledWith('boom', expect.any(String));
  });
});
