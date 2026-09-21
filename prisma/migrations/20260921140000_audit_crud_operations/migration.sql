-- CreateEnum
CREATE TYPE "AuditOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "operation" "AuditOperation" NOT NULL DEFAULT 'CREATE';
ALTER TABLE "AuditLog" ADD COLUMN "parentId" TEXT;

UPDATE "AuditLog" SET "operation" = 'DELETE' WHERE "action" LIKE '%DELETED%' OR "action" LIKE '%REMOVED%';
UPDATE "AuditLog" SET "operation" = 'UPDATE' WHERE "action" LIKE '%UPDATED%' OR "action" LIKE '%PROGRESS%';

CREATE INDEX "AuditLog_parentId_idx" ON "AuditLog"("parentId");
CREATE INDEX "AuditLog_operation_idx" ON "AuditLog"("operation");
