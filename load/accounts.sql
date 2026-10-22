-- Real accounts on top of backend/scripts/perf/seed.sql (which creates users with a dummy password hash).
-- All three log in with the password "password123". Run ONLY against the *_test database, after seed.sql:
--   npm run load:seed   (does both)
DO $$
BEGIN
  IF current_database() NOT LIKE '%\_test' THEN
    RAISE EXCEPTION 'Refusing to touch accounts: % is not a *_test database', current_database();
  END IF;
END $$;

-- Teacher 1 owns subjects 57, 100, 157, 200 in the seed data; student 1 is user 101
UPDATE users SET email = 'teacher@perf.test', password = '$2b$10$izRaFA85NYR99PiIbIwELedN9R05Lx2SaY2jSKcfwJasU8UU9KtlS' WHERE id = 1;
UPDATE users SET email = 'student@perf.test', password = '$2b$10$izRaFA85NYR99PiIbIwELedN9R05Lx2SaY2jSKcfwJasU8UU9KtlS' WHERE id = 101;
INSERT INTO users (email, password, role, created_at, updated_at)
VALUES ('admin@perf.test', '$2b$10$izRaFA85NYR99PiIbIwELedN9R05Lx2SaY2jSKcfwJasU8UU9KtlS', 'ADMIN', now(), now());
