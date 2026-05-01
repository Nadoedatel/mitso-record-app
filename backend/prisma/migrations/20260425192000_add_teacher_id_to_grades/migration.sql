-- AlterTable
ALTER TABLE "grades" ADD COLUMN IF NOT EXISTS "teacher_id" INTEGER;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
