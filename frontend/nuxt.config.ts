// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // Closed app behind login with an in-memory bearer token: SSR gives nothing (no SEO)
  // and would share module-level state between requests, so render on the client only
  ssr: false,

  // Headers for every page served by the Nitro server (Render runs `node .output/server/index.mjs`).
  // No script CSP on purpose: the Nuxt bootstrap is an inline script, so a useful CSP needs nonces or
  // hashes and tuning for Sentry. frame-ancestors alone is safe and stops clickjacking.
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "frame-ancestors 'none'",
      },
    },
  },

  // Modules
  modules: ['@pinia/nuxt'],

  // TypeScript configuration
  // Type checking runs separately via `npm run typecheck`, not inside dev/build
  typescript: {
    strict: true,
    tsConfig: { compilerOptions: { noImplicitReturns: true } },
  },

  // Runtime config (override with NUXT_PUBLIC_API_URL, NUXT_PUBLIC_SENTRY_DSN, ...)
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:8080/api',
      // Sentry is off until NUXT_PUBLIC_SENTRY_DSN is set. RENDER_GIT_COMMIT ties errors to the deployed commit
      sentry: {
        dsn: '',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        release: process.env.RENDER_GIT_COMMIT ?? '',
        tracesSampleRate: 0,
      },
    },
  },

  // CSS
  css: ['~/assets/styles/main.scss'],

  // Vite
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: ['./app'],
        },
      },
    },
  },
})
