/** Extra facts attached to a reported error, to match it with backend logs */
export interface ErrorContext {
  requestId?: string
  status?: number
  endpoint?: string
}

/**
 * A place to send unexpected errors to (Sentry, or nothing).
 * App code talks to this interface, not to the Sentry SDK: monitoring stays optional,
 * the SDK is loaded lazily only when a DSN is configured, and tests can swap in a fake.
 */
export interface ErrorReporter {
  capture(error: Error, context?: ErrorContext): void
}

const noopReporter: ErrorReporter = { capture: () => undefined }

let current: ErrorReporter = noopReporter

/** Install the active reporter (done once by the sentry.client plugin) */
export function setErrorReporter(reporter: ErrorReporter): void {
  current = reporter
}

/** Back to the do-nothing reporter (for tests) */
export function resetErrorReporter(): void {
  current = noopReporter
}

/**
 * Report an unexpected error. Never throws: a broken monitoring service
 * must not break the request or the page that hit the error.
 */
export function reportError(error: Error, context?: ErrorContext): void {
  try {
    current.capture(error, context)
  } catch {
    // Reporting is best effort
  }
}
