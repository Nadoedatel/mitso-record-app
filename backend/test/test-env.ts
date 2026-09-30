/**
 * Connection settings of the dedicated e2e database (service `postgres-test` in docker-compose).
 * Kept apart from the dev DB (port 5433 vs 5432, name mitso_test) so tests can wipe tables freely.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/mitso_test';

/**
 * Refuse to run against anything that does not look like a test database.
 * The e2e helpers TRUNCATE every table, so pointing them at the dev DB would destroy its data.
 */
export function assertTestDatabase(url: string): void {
  const dbName = new URL(url).pathname.replace('/', '');
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to run e2e tests: database "${dbName}" does not end with "_test"`,
    );
  }
}
