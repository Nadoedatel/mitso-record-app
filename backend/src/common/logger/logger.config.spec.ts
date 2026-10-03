import { Writable } from 'node:stream';
import { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import { customLogLevel, genRequestId, REDACT_PATHS, REQUEST_ID_HEADER, resolveLogLevel } from './logger.config';

const reqWith = (headers: Record<string, string> = {}) => ({ headers }) as unknown as IncomingMessage;
const resWith = (statusCode = 200) => {
  const headers: Record<string, string> = {};
  return {
    statusCode,
    headers,
    setHeader: (name: string, value: string) => void (headers[name] = value),
  } as unknown as ServerResponse & { headers: Record<string, string> };
};

describe('logger config', () => {
  describe('resolveLogLevel', () => {
    it.each([
      [{ LOG_LEVEL: 'warn', NODE_ENV: 'production' }, 'warn'],
      [{ NODE_ENV: 'test' }, 'silent'],
      [{ NODE_ENV: 'production' }, 'info'],
      [{}, 'debug'],
    ])('%j -> %s', (env, expected) => {
      expect(resolveLogLevel(env as NodeJS.ProcessEnv)).toBe(expected);
    });
  });

  describe('genRequestId', () => {
    it('reuses the id sent by the caller and echoes it in the response', () => {
      const res = resWith();

      expect(genRequestId(reqWith({ [REQUEST_ID_HEADER]: 'abc-123' }), res)).toBe('abc-123');
      expect(res.headers[REQUEST_ID_HEADER]).toBe('abc-123');
    });

    it('generates a fresh id when none is sent', () => {
      const a = genRequestId(reqWith(), resWith());
      const b = genRequestId(reqWith(), resWith());

      expect(a).toMatch(/^[0-9a-f-]{36}$/);
      expect(a).not.toBe(b);
    });

    it('ignores an oversized id (log injection / bloat guard)', () => {
      const id = genRequestId(reqWith({ [REQUEST_ID_HEADER]: 'x'.repeat(500) }), resWith());

      expect(id).toHaveLength(36);
    });
  });

  describe('customLogLevel', () => {
    it.each([
      [200, 'info'],
      [404, 'warn'],
      [401, 'warn'],
      [500, 'error'],
      [503, 'error'],
    ])('status %i is logged as %s', (status, level) => {
      expect(customLogLevel(reqWith(), resWith(status))).toBe(level);
    });

    it('logs as error when the request carries an error', () => {
      expect(customLogLevel(reqWith(), resWith(200), new Error('x'))).toBe('error');
    });
  });

  describe('redaction', () => {
    it('masks the authorization header and cookies', () => {
      const lines: string[] = [];
      const sink = new Writable({
        write(chunk, _enc, done) {
          lines.push(chunk.toString());
          done();
        },
      });
      const logger = pino({ redact: { paths: REDACT_PATHS, censor: '[Redacted]' } }, sink);

      logger.info({
        req: { headers: { authorization: 'Bearer secret-token', cookie: 'refreshToken=secret-cookie', accept: 'json' } },
        res: { headers: { 'set-cookie': ['refreshToken=secret-cookie'] } },
      });

      const line = lines.join('');
      expect(line).not.toContain('secret-token');
      expect(line).not.toContain('secret-cookie');
      expect(line).toContain('[Redacted]');
      expect(line).toContain('json');
    });
  });
});
