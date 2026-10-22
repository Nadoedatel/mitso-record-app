-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('GRADE_CREATE', 'GRADE_UPDATE', 'GRADE_DELETE');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" INTEGER,
    "actor_email" TEXT NOT NULL,
    "actor_role" "Role" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_id" INTEGER,
    "student_id" INTEGER,
    "subject_id" INTEGER,
    "before" JSONB,
    "after" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_student_id_idx" ON "audit_logs"("student_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

