import type { ErrorEvent, NodeOptions } from '@sentry/nestjs';

/**
 * What the SDK may send along with an error. Sentry 11 collects almost everything by default
 * (cookies, all headers, request bodies, local variables of stack frames), and here a login body
 * holds a password and `bcrypt.compare(dto.password, ...)` has it in a local variable.
 * So everything is off except a few harmless headers, which is enough to debug a 500.
 */
export const SENTRY_DATA_COLLECTION: NonNullable<NodeOptions['dataCollection']> = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ['user-agent', 'content-type', 'x-request-id'] }, response: false },
  httpBodies: [],
  databaseQueryData: false,
  stackFrameVariables: false,
  queues: false,
};

/**
 * Builds Sentry options from the environment, or undefined when SENTRY_DSN is not set.
 * No DSN means Sentry is off completely: local development, tests and deployments without an account.
 */
export function buildSentryOptions(env: NodeJS.ProcessEnv = process.env): NodeOptions | undefined {
  if (!env.SENTRY_DSN) return undefined;

  const rate = Number(env.SENTRY_TRACES_SAMPLE_RATE);
  return {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || 'development',
    // Render exposes the deployed commit; it ties every error to the release that introduced it
    release: env.SENTRY_RELEASE || env.RENDER_GIT_COMMIT || undefined,
    dataCollection: SENTRY_DATA_COLLECTION,
    // Errors only by default; performance tracing is opt-in because it counts against the free quota
    tracesSampleRate: Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0,
    beforeSend: scrubEvent,
  };
}

/**
 * Removes anything secret from an event before it leaves the server:
 * cookies, the Authorization header and the request body (a login body holds a password).
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
  }
  return event;
}
