import { assertTestDatabase, TEST_DATABASE_URL } from './test-env';

// Runs in every test file before any app code is imported.
// process.env wins over backend/.env, because dotenv never overrides existing variables.
assertTestDatabase(TEST_DATABASE_URL);
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_ACCESS_SECRET = 'e2e-access-secret';
process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret';
process.env.NODE_ENV = 'test';
