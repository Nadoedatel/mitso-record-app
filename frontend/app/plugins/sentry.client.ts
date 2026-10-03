import { setErrorReporter } from '~/shared/lib/errorReporter'
import { buildSentryOptions } from '~/shared/lib/sentryConfig'

/**
 * Sentry for the browser. Does nothing (and downloads nothing) unless a DSN is configured:
 * set NUXT_PUBLIC_SENTRY_DSN at runtime, no rebuild needed.
 *
 * Uses @sentry/vue directly rather than @sentry/nuxt: the app is a client-only SPA (ssr: false),
 * so there is no server rendering to instrument and no need for the module's build-time machinery.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const options = buildSentryOptions(useRuntimeConfig().public.sentry)
  if (!options) return

  // Lazy import: the SDK stays out of the bundle path for deployments without a DSN
  const Sentry = await import('@sentry/vue')
  Sentry.init(options)

  // Errors thrown inside components and their lifecycle hooks
  nuxtApp.hook('vue:error', (error) => {
    Sentry.captureException(error)
  })

  // Errors the app reports itself (API 5xx)
  setErrorReporter({
    capture(error, context = {}) {
      Sentry.withScope((scope) => {
        if (context.requestId) scope.setTag('request_id', context.requestId)
        if (context.status !== undefined) scope.setTag('http.status', String(context.status))
        if (context.endpoint) scope.setTag('http.endpoint', context.endpoint)
        Sentry.captureException(error)
      })
    },
  })
})
