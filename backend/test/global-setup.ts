import { execSync } from 'node:child_process';
import { assertTestDatabase, TEST_DATABASE_URL } from './test-env';

/**
 * Runs once before all e2e files: applies migrations to the empty test DB,
 * so tests run against the real schema (the same migrations as production).
 */
export default function globalSetup(): void {
  assertTestDatabase(TEST_DATABASE_URL);
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
