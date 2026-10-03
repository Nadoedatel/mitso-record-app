-- Plans of the application's hot queries (hand-written equivalents of what Prisma generates).
-- Run against the seeded *_test database:
--   docker exec -i mitso-postgres-test psql -U postgres -d mitso_test < scripts/perf/queries.sql
\set ON_ERROR_STOP on
\pset pager off

\echo '== Q1 grades of one subject, newest first, page of 20 (GET /grades?subjectId=)'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM grades WHERE subject_id = 57 ORDER BY exam_date DESC LIMIT 20;

\echo '== Q2 count of grades of one subject (pagination total)'
EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM grades WHERE subject_id = 57;

\echo '== Q3 group roster (students of one group, by last name)'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students WHERE group_id = 123 ORDER BY last_name;

\echo '== Q4 grades of a group roster for one subject (grade entry screen)'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM grades
  WHERE student_id IN (SELECT id FROM students WHERE group_id = 123) AND subject_id = 57 ORDER BY exam_date DESC;

\echo '== Q5 students search by name fragment (ILIKE contains, first page)'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM students
  WHERE first_name ILIKE '%van%' OR last_name ILIKE '%van%' OR middle_name ILIKE '%van%' ORDER BY last_name LIMIT 20;

\echo '== Q6 subjects of one group'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM subject_groups WHERE group_id = 123;

\echo '== Q7 teachers of one subject'
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM teacher_subjects WHERE subject_id = 57;

\echo '== Q8 groups list page: students of 20 groups (groups.findAll includes students)'
EXPLAIN (ANALYZE, BUFFERS) SELECT id, first_name, last_name, student_id, group_id FROM students WHERE group_id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20);

\echo '== Q9 students per specialization (_count)'
EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM students WHERE specialization_id = 7;

\echo '== D1 delete a teacher (FK actions: grades.teacher_id SET NULL, teacher_subjects CASCADE)'
BEGIN; EXPLAIN (ANALYZE) DELETE FROM teachers WHERE id = 5; ROLLBACK;

\echo '== D2 delete a group (FK actions: students.group_id SET NULL, subject_groups CASCADE)'
BEGIN; EXPLAIN (ANALYZE) DELETE FROM groups WHERE id = 123; ROLLBACK;

\echo '== D3 delete a subject (FK actions: grades CASCADE, teacher_subjects, subject_groups)'
BEGIN; EXPLAIN (ANALYZE) DELETE FROM subjects WHERE id = 57; ROLLBACK;

\echo '== D4 delete a specialization (FK action: students.specialization_id SET NULL)'
BEGIN; EXPLAIN (ANALYZE) DELETE FROM specializations WHERE id = 7; ROLLBACK;
