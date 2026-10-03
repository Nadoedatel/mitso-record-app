/**
 * Sentry bootstrap. Must be the FIRST import of main.ts: the SDK patches http, express and other
 * modules when it starts, so it has to run before they are loaded.
 *
 * Without SENTRY_DSN nothing happens and the SDK is never even loaded.
 */
import { ErrorContext, setErrorReporter } from './common/monitoring/error-reporter';
import { buildSentryOptions } from './common/monitoring/sentry.config';

const options = buildSentryOptions();

if (options) {
  // Loaded lazily so deployments and tests without a DSN do not pay for (or depend on) the SDK
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/nestjs') as typeof import('@sentry/nestjs');
  Sentry.init(options);

  setErrorReporter({
    capture(error: Error, context: ErrorContext = {}) {
      Sentry.withScope((scope) => {
        if (context.requestId) scope.setTag('request_id', context.requestId);
        if (context.method) scope.setTag('http.method', context.method);
        if (context.url) scope.setTag('http.url', context.url);
        // Numeric id only, no email or name
        if (context.userId !== undefined) scope.setUser({ id: String(context.userId) });
        Sentry.captureException(error);
      });
    },
  });
}
