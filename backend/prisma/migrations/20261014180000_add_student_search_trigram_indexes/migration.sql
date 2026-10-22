-- Substring search over student names ("contains text", ILIKE '%text%') cannot use a B-tree index and reads the whole table.
-- pg_trgm splits text into three-letter pieces; a GIN index over them answers ILIKE '%text%' directly.
-- pg_trgm is a "trusted" extension (PostgreSQL 13+): the database owner may create it, no superuser needed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pg_trgm decides what a "letter" is by the database locale. In a database created with the C locale it may treat
-- Cyrillic as separators, and the indexes below would be empty and useless without any error. Say so loudly.
DO $$
BEGIN
  IF coalesce(array_length(show_trgm('иванов'), 1), 0) < 4 THEN
    RAISE WARNING 'pg_trgm does not index Cyrillic in this database (collation: %). Student search will not use the trigram indexes. Recreate the database with a UTF-8 locale such as en_US.UTF-8 or C.UTF-8.',
      (SELECT datcollate FROM pg_database WHERE datname = current_database());
  END IF;
END $$;

-- CreateIndex
CREATE INDEX "students_first_name_trgm_idx" ON "students" USING GIN ("first_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "students_last_name_trgm_idx" ON "students" USING GIN ("last_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "students_middle_name_trgm_idx" ON "students" USING GIN ("middle_name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "students_student_id_trgm_idx" ON "students" USING GIN ("student_id" gin_trgm_ops);
