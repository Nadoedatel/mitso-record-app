-- DropIndex
DROP INDEX "audit_logs_created_at_idx";

-- CreateIndex
CREATE INDEX "audit_logs_created_at_id_idx" ON "audit_logs"("created_at" DESC, "id" DESC);

