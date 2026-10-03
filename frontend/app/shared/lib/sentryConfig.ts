import type { Breadcrumb, ErrorEvent, init } from '@sentry/vue'

/** Options accepted by Sentry.init (the SDK does not export this type under a name) */
type VueOptions = NonNullable<Parameters<typeof init>[0]>

/** The `runtimeConfig.public.sentry` block (override at runtime with NUXT_PUBLIC_SENTRY_*) */
export interface SentryPublicConfig {
  dsn?: string
  environment?: string
  release?: string
  tracesSampleRate?: number | string
}

/**
 * What the SDK may send along with an error. Sentry 11 collects a lot by default
 * (cookies, headers, bodies, query strings). This app shows student names and grades,
 * so all of it is off: an error report needs a stack trace, not the user's data.
 */
export const SENTRY_DATA_COLLECTION: NonNullable<VueOptions['dataCollection']> = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
}

/** Noise that is not a bug: user offline, browser quirks, extensions */
const IGNORED_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Failed to fetch',
  'Load failed',
  'NetworkError when attempting to fetch resource',
]
const DENIED_URLS = [/extensions\//i, /^chrome(-extension)?:\/\//i, /^moz-extension:\/\//i]

/**
 * Builds Sentry options from the public runtime config, or undefined when no DSN is set.
 * No DSN means Sentry is off completely and its code is never downloaded.
 */
export function buildSentryOptions(config: SentryPublicConfig = {}): VueOptions | undefined {
  if (!config.dsn) return undefined

  const rate = Number(config.tracesSampleRate)
  return {
    dsn: config.dsn,
    environment: config.environment || 'production',
    release: config.release || undefined,
    // Errors only by default; tracing is opt-in because it counts against the free quota
    tracesSampleRate: Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0,
    dataCollection: SENTRY_DATA_COLLECTION,
    ignoreErrors: IGNORED_ERRORS,
    denyUrls: DENIED_URLS,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  }
}

/** "/students?search=Иванов" -> "/students": search terms are names, i.e. personal data */
export function stripQuery(url: string): string {
  const cut = url.search(/[?#]/)
  return cut === -1 ? url : url.slice(0, cut)
}

/** Drops cookies, the request body and sensitive headers, and query strings from the event URL */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies
    delete event.request.data
    delete event.request.query_string
    if (event.request.url) event.request.url = stripQuery(event.request.url)
    if (event.request.headers) {
      delete event.request.headers['Authorization']
      delete event.request.headers['authorization']
      delete event.request.headers['Cookie']
      delete event.request.headers['cookie']
    }
  }
  return event
}

/**
 * Keeps breadcrumbs useful but harmless: fetch/xhr URLs lose their query string,
 * console output is dropped (it may print objects with personal data).
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category === 'console') return null
  if (
    (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') &&
    typeof breadcrumb.data?.url === 'string'
  ) {
    breadcrumb.data.url = stripQuery(breadcrumb.data.url)
  }
  return breadcrumb
}
