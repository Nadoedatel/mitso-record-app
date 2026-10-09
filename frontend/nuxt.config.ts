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

  // The component showcase (pages/dev/ui.vue) is a development tool: it is not part of the production routes
  hooks: {
    'pages:extend'(pages) {
      if (process.env.NODE_ENV !== 'production') return
      const index = pages.findIndex((page) => page.path === '/dev/ui')
      if (index >= 0) pages.splice(index, 1)
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

  // CSS. Roboto is the font of mitso.by; self-hosted, only the weights used (fontsource ships unicode-range subsets,
  // the browser downloads the Cyrillic/Latin files it needs)
  css: [
    '@fontsource/roboto/400.css',
    '@fontsource/roboto/500.css',
    '@fontsource/roboto/700.css',
    '~/assets/styles/main.scss',
  ],

  // The saved theme is applied before the first paint: otherwise a dark-theme user sees a white flash on every load.
  // Keep in sync with shared/lib/useTheme.ts (same storage key and rule)
  app: {
    head: {
      meta: [{ name: 'color-scheme', content: 'light dark' }],
      script: [
        {
          innerHTML:
            "(function(){try{var m=localStorage.getItem('mitso:theme');var d=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}})()",
          tagPosition: 'head',
        },
      ],
    },
  },

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
