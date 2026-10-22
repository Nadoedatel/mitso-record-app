#!/bin/sh
# Fills the e2e database (docker service postgres-test, port 5433) with load-test data:
# 20 000 students, 500 000 grades (backend/scripts/perf/seed.sql) and three accounts to log in with (accounts.sql).
# The migrations must be applied first: run `npm run test:db` in backend (or any backend e2e run) once.
set -eu
cd "$(dirname "$0")/.."

docker compose --profile test up -d --wait postgres-test
docker exec -i mitso-postgres-test psql -U postgres -d mitso_test -v ON_ERROR_STOP=1 < backend/scripts/perf/seed.sql
docker exec -i mitso-postgres-test psql -U postgres -d mitso_test -v ON_ERROR_STOP=1 < load/accounts.sql
echo "Load data ready: teacher@perf.test, student@perf.test, admin@perf.test (password123)"
