import { randomUUID } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Params } from 'nestjs-pino';

/** Header carrying the correlation id, accepted from a caller (proxy, frontend) and echoed back */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Paths that must never reach the logs, even if a log line is ever given the whole request object */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

/** Kubernetes/Docker/Render probes hit this constantly; logging every probe would drown real traffic */
const QUIET_URLS = ['/api/health'];

/**
 * Picks the log level: LOG_LEVEL wins, otherwise silent in tests, info in production, debug elsewhere.
 */
export function resolveLogLevel(env: NodeJS.ProcessEnv = process.env): string {
  if (env.LOG_LEVEL) return env.LOG_LEVEL;
  if (env.NODE_ENV === 'test') return 'silent';
  return env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Correlation id of a request: reuse the caller's one, otherwise generate.
 * The id is echoed in the response header so a user's bug report can be matched to log lines.
 */
export function genRequestId(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128 ? incoming : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}

/** 5xx is an error, 4xx a warning (client mistake, expected in normal operation), the rest info */
export function customLogLevel(_req: IncomingMessage, res: ServerResponse, err?: Error): 'error' | 'warn' | 'info' {
  if (err || res.statusCode >= 500) return 'error';
  if (res.statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Builds the nestjs-pino configuration.
 * JSON lines in production (machine-searchable); readable colored output on a developer machine.
 */
export function buildLoggerParams(env: NodeJS.ProcessEnv = process.env): Params {
  const prettyOutput = env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test';

  return {
    pinoHttp: {
      level: resolveLogLevel(env),
      genReqId: genRequestId,
      customLogLevel,
      redact: { paths: REDACT_PATHS, censor: '[Redacted]' },
      autoLogging: { ignore: (req) => QUIET_URLS.includes((req.url ?? '').split('?')[0]) },
      // Keep request lines small: who asked for what, not the whole header set
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
      transport: prettyOutput
        ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } }
        : undefined,
    },
  };
}
