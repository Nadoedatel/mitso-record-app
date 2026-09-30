-- CreateIndex
-- Grades of one subject, newest first; also serves the FK action when a subject is deleted.
CREATE INDEX "grades_subject_id_exam_date_idx" ON "grades"("subject_id", "exam_date" DESC);

-- CreateIndex
-- Group roster; also serves the FK action when a group is deleted.
CREATE INDEX "students_group_id_idx" ON "students"("group_id");
