import { defineConfig, devices } from '@playwright/test'

/**
 * Browser e2e: real Nuxt frontend + real NestJS backend + a throwaway PostgreSQL (service `postgres-test`).
 * The backend command wipes and reseeds the database, so it must be a `*_test` DB (checked below).
 * Ports are fixed: the frontend calls http://localhost:8080/api by default.
 */
const databaseUrl =
  process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/mitso_test'

const dbName = new URL(databaseUrl).pathname.replace('/', '')
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run e2e: database "${dbName}" does not end with "_test" (seed wipes all tables)`)
}

const FRONTEND_URL = 'http://localhost:3000'
const BACKEND_URL = 'http://localhost:8080'

export default defineConfig({
  testDir: './e2e',
  // Login and refresh are limited to 10 requests per minute per IP, so no parallel logins
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      cwd: '../backend',
      command: 'npx prisma migrate deploy && npx prisma db seed && npm run start',
      url: `${BACKEND_URL}/api/health`,
      // Never attach to a dev backend that points at the dev database
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        DATABASE_URL: databaseUrl,
        // Long random-looking values: main.ts rejects short and placeholder secrets
        JWT_ACCESS_SECRET: 'e2e-access-8f3b1c7a92d44e5fa6b0c3d1e7f2a9b4',
        JWT_REFRESH_SECRET: 'e2e-refresh-5d2a7e9c1b6f4083a1c8e3d7b9f0a2c6',
        FRONTEND_URL,
        PORT: '8080',
        NODE_ENV: 'development',
        REDIS_URL: '',
      },
    },
    {
      command: 'npm run dev',
      url: `${FRONTEND_URL}/login`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
