-- Realistic data volume for query-plan measurements. Run ONLY against the e2e database:
--   docker exec -i mitso-postgres-test psql -U postgres -d mitso_test < scripts/perf/seed.sql
-- (the e2e tests truncate every table before each test, so this data is temporary by design)
DO $$
BEGIN
  IF current_database() NOT LIKE '%\_test' THEN
    RAISE EXCEPTION 'Refusing to seed: % is not a *_test database', current_database();
  END IF;
END $$;

TRUNCATE TABLE users, students, teachers, faculties, specializations, groups, subjects,
  teacher_subjects, subject_groups, grades RESTART IDENTITY CASCADE;

INSERT INTO faculties (name, created_at, updated_at)
SELECT 'Faculty ' || g, now(), now() FROM generate_series(1, 5) g;

INSERT INTO specializations (name, code, faculty_id, created_at, updated_at)
SELECT 'Specialization ' || g, '1-40 ' || g, 1 + (g % 5), now(), now() FROM generate_series(1, 50) g;

INSERT INTO groups (name, course, faculty_id, created_at, updated_at)
SELECT 'GR-' || g, 1 + (g % 6), 1 + (g % 5), now(), now() FROM generate_series(1, 400) g;

INSERT INTO subjects (name, code, credits, semester, created_at, updated_at)
SELECT 'Subject ' || g, 'SUBJ-' || g, 1 + (g % 10), 1 + (g % 12), now(), now() FROM generate_series(1, 200) g;

-- 100 teachers (users 1..100) and 20 000 students (users 101..20100)
INSERT INTO users (email, password, role, created_at, updated_at)
SELECT 'u' || g || '@perf.test', 'x', CASE WHEN g <= 100 THEN 'TEACHER'::"Role" ELSE 'STUDENT'::"Role" END, now(), now()
FROM generate_series(1, 20100) g;

INSERT INTO teachers (user_id, first_name, last_name, department, position, created_at, updated_at)
SELECT g, 'Teacher', 'Prof' || g, 'IT', 'Lecturer', now(), now() FROM generate_series(1, 100) g;

INSERT INTO students (user_id, first_name, last_name, student_id, group_id, course, specialization_id, enrollment_year, created_at, updated_at)
SELECT 100 + g,
       (ARRAY['Ivan','Petr','Anna','Olga','Sergey','Maria'])[1 + (g % 6)],
       (ARRAY['Ivanov','Petrov','Sidorov','Kozlov','Smirnov','Volkov','Popov','Sokolov'])[1 + (g % 8)] || g,
       'ST-' || g, 1 + (g % 400), 1 + (g % 6), 1 + (g % 50), 2020 + (g % 6), now(), now()
FROM generate_series(1, 20000) g;

INSERT INTO teacher_subjects (teacher_id, subject_id, created_at)
SELECT DISTINCT t, s, now()
FROM (SELECT s, 1 + ((s * 3) % 100) AS t FROM generate_series(1, 200) s
      UNION SELECT s, 1 + ((s * 7 + 1) % 100) FROM generate_series(1, 200) s) x(s, t);

INSERT INTO subject_groups (subject_id, group_id, created_at)
SELECT s, 1 + ((s * 13 + k * 50) % 400), now() FROM generate_series(1, 200) s, generate_series(0, 7) k;

-- 25 grades per student = 500 000 rows
INSERT INTO grades (student_id, subject_id, teacher_id, grade_value, grade_type, exam_date, created_at, updated_at)
SELECT s, 1 + ((s * 7 + k) % 200), 1 + ((1 + ((s * 7 + k) % 200)) % 100),
       1 + floor(random() * 10)::int, 'EXAM', date '2025-01-01' + (random() * 500)::int, now(), now()
FROM generate_series(1, 20000) s, generate_series(0, 24) k;

ANALYZE;

SELECT 'students' AS tbl, count(*) FROM students
UNION ALL SELECT 'grades', count(*) FROM grades
UNION ALL SELECT 'groups', count(*) FROM groups
UNION ALL SELECT 'subject_groups', count(*) FROM subject_groups
UNION ALL SELECT 'teacher_subjects', count(*) FROM teacher_subjects;
