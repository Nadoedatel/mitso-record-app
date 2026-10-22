-- Student search before and after the trigram indexes, on the seeded *_test database (npm run load:seed):
--   docker exec -i mitso-postgres-test psql -U postgres -d mitso_test < scripts/perf/trigram.sql
-- "Before" is measured inside a transaction that drops the four indexes and is rolled back, so nothing changes.
\set ON_ERROR_STOP on
\pset pager off

\echo '== 0. Does pg_trgm understand Cyrillic here? (must list many trigrams; an empty list means the C locale)'
SELECT current_database() AS db, (SELECT datcollate FROM pg_database WHERE datname = current_database()) AS collate;
SELECT show_trgm('иванов') AS trigrams_of_ivanov;

\echo '== 1. Indexes present'
SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes WHERE tablename = 'students' AND indexdef LIKE '%gin_trgm_ops%' ORDER BY indexname;

\echo '== 2. BEFORE: without the trigram indexes (rolled back afterwards)'
BEGIN;
DROP INDEX students_first_name_trgm_idx, students_last_name_trgm_idx, students_middle_name_trgm_idx, students_student_id_trgm_idx;
\echo '-- one word, a frequent fragment'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%иван%' OR last_name ILIKE '%иван%' OR middle_name ILIKE '%иван%' OR student_id ILIKE '%иван%')
  ORDER BY last_name LIMIT 20;
\echo '-- one word, a rare fragment'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%соколов1234%' OR last_name ILIKE '%соколов1234%' OR middle_name ILIKE '%соколов1234%' OR student_id ILIKE '%соколов1234%')
  ORDER BY last_name LIMIT 20;
\echo '-- two words'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%иванов%' OR last_name ILIKE '%иванов%' OR middle_name ILIKE '%иванов%' OR student_id ILIKE '%иванов%')
    AND (first_name ILIKE '%иван%' OR last_name ILIKE '%иван%' OR middle_name ILIKE '%иван%' OR student_id ILIKE '%иван%')
  ORDER BY last_name LIMIT 20;
ROLLBACK;

\echo '== 3. AFTER: with the trigram indexes (look for "Bitmap Index Scan on students_*_trgm_idx")'
ANALYZE students;
\echo '-- one word, a frequent fragment'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%иван%' OR last_name ILIKE '%иван%' OR middle_name ILIKE '%иван%' OR student_id ILIKE '%иван%')
  ORDER BY last_name LIMIT 20;
\echo '-- one word, a rare fragment'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%соколов1234%' OR last_name ILIKE '%соколов1234%' OR middle_name ILIKE '%соколов1234%' OR student_id ILIKE '%соколов1234%')
  ORDER BY last_name LIMIT 20;
\echo '-- two words'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%иванов%' OR last_name ILIKE '%иванов%' OR middle_name ILIKE '%иванов%' OR student_id ILIKE '%иванов%')
    AND (first_name ILIKE '%иван%' OR last_name ILIKE '%иван%' OR middle_name ILIKE '%иван%' OR student_id ILIKE '%иван%')
  ORDER BY last_name LIMIT 20;
\echo '-- a one-letter word: too short for a trigram, expect a Seq Scan (and that is fine)'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE (first_name ILIKE '%а%' OR last_name ILIKE '%а%' OR middle_name ILIKE '%а%' OR student_id ILIKE '%а%')
  ORDER BY last_name LIMIT 20;
