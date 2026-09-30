-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('EXAM', 'CREDIT', 'COURSEWORK', 'TEST', 'LAB');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "student_id" TEXT NOT NULL,
    "group_id" INTEGER,
    "course" INTEGER NOT NULL,
    "specialization_id" INTEGER,
    "enrollment_year" INTEGER NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "birth_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "academic_degree" TEXT,
    "phone" TEXT,
    "office_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER,
    "grade_value" INTEGER NOT NULL,
    "grade_type" "GradeType" NOT NULL,
    "exam_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "faculty_id" INTEGER,
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

-- CreateTable
CREATE TABLE "faculties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specializations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "faculty_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "grades_student_id_subject_id_grade_type_key" ON "grades"("student_id", "subject_id", "grade_type");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacher_id_subject_id_key" ON "teacher_subjects"("teacher_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_groups_subject_id_group_id_key" ON "subject_groups"("subject_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_name_key" ON "faculties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "specializations_name_faculty_id_key" ON "specializations"("name", "faculty_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "specializations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specializations" ADD CONSTRAINT "specializations_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

