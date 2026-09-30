// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // Closed app behind login with an in-memory bearer token: SSR gives nothing (no SEO)
  // and would share module-level state between requests, so render on the client only
  ssr: false,

  // Modules
  modules: ['@pinia/nuxt'],

  // TypeScript configuration
  // Type checking runs separately via `npm run typecheck`, not inside dev/build
  typescript: {
    strict: true,
    tsConfig: { compilerOptions: { noImplicitReturns: true } },
  },

  // Runtime config (override with NUXT_PUBLIC_API_URL)
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:8080/api',
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
