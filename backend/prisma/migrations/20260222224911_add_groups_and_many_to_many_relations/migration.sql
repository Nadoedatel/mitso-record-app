-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "faculty" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_groups" (
    "id" SERIAL NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_groups_pkey" PRIMARY KEY ("id")
);

-- AddColumn to students table BEFORE using it in the migration script
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "group_id" INTEGER;

-- Migrate existing data from students.group to groups table and link students
DO $$
DECLARE
    group_record RECORD;
    new_group_id INTEGER;
BEGIN
    -- Create groups from existing student.group values
    FOR group_record IN
        SELECT DISTINCT "group", course, faculty
        FROM students
        WHERE "group" IS NOT NULL
    LOOP
        INSERT INTO groups (name, course, faculty, created_at, updated_at)
        VALUES (group_record.group, group_record.course, group_record.faculty, NOW(), NOW())
        RETURNING id INTO new_group_id;

        -- Update students with new group_id
        UPDATE students
        SET group_id = new_group_id
        WHERE "group" = group_record.group;
    END LOOP;
END $$;

-- Migrate existing teacher-subject relations to teacher_subjects table
INSERT INTO teacher_subjects (teacher_id, subject_id, created_at)
SELECT teacher_id, id, NOW()
FROM subjects;

-- DropColumn
ALTER TABLE "students" DROP COLUMN "group";

-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_teacher_id_fkey";

-- DropColumn
ALTER TABLE "subjects" DROP COLUMN "teacher_id";

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacher_id_subject_id_key" ON "teacher_subjects"("teacher_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_groups_subject_id_group_id_key" ON "subject_groups"("subject_id", "group_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable groups - add faculty_id
ALTER TABLE "groups" DROP COLUMN "faculty",
ADD COLUMN "faculty_id" INTEGER;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
