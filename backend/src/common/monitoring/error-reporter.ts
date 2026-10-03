/** Extra facts attached to a reported error, to find the matching log lines and user */
export interface ErrorContext {
  requestId?: string;
  userId?: number;
  method?: string;
  url?: string;
}

/**
 * A place to send unexpected errors to (Sentry, or nothing).
 * The app talks to this interface, not to the Sentry SDK, so monitoring stays optional:
 * without configuration the reporter does nothing, and tests can swap in a fake.
 */
export interface ErrorReporter {
  capture(error: Error, context?: ErrorContext): void;
}

const noopReporter: ErrorReporter = { capture: () => undefined };

let current: ErrorReporter = noopReporter;

/** Install the active reporter (called once at startup by instrument.ts) */
export function setErrorReporter(reporter: ErrorReporter): void {
  current = reporter;
}

/** Back to the do-nothing reporter (for tests) */
export function resetErrorReporter(): void {
  current = noopReporter;
}

/**
 * Report an unexpected error. Never throws: a broken monitoring service
 * must not turn a handled 500 response into a crash.
 */
export function reportError(error: Error, context?: ErrorContext): void {
  try {
    current.capture(error, context);
  } catch {
    // Reporting is best effort; the error is already logged by the caller
  }
}
