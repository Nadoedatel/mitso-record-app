// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // Source directory
  srcDir: 'src/',

  // Modules
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // Runtime config
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    },
  },

  // Route rules
  routeRules: {
    '/': { redirect: '/login' },
  },

  // Path aliases
  alias: {
    '@': './src',
  },

  // Auto imports
  imports: {
    dirs: ['composables/**', 'utils/**'],
  },

  // CSS
  css: ['@/app/styles/main.scss'],

  // Vite
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: ['./src'],
          additionalData: "@use 'shared/styles/mixins' as *;",
        },
      },
    },
  },
})
