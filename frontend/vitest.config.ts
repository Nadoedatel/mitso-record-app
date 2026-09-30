import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const src = fileURLToPath(new URL('./app', import.meta.url))

// Plain unit tests (no Nuxt runtime): auto-imports are stubbed per test with vi.stubGlobal
export default defineConfig({
  resolve: { alias: { '~': src, '@': src } },
  test: { environment: 'node', include: ['tests/**/*.spec.ts'] },
})
