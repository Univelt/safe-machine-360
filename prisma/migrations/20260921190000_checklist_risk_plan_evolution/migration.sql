CREATE TYPE "RiskOrigin" AS ENUM ('AUTOMATIC', 'MANUAL');

ALTER TABLE "Machine"
  ADD COLUMN "riskOrigin" "RiskOrigin" NOT NULL DEFAULT 'AUTOMATIC',
  ADD COLUMN "manualRiskLevel" "RiskLevel";

ALTER TABLE "ChecklistTemplate"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "ChecklistTemplateItem"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "ActionPlan"
  ADD COLUMN "checklistExecutionId" TEXT;

CREATE TABLE "ActionPlanAttachment" (
  "id" TEXT NOT NULL,
  "actionPlanId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "fileUrl" TEXT,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionPlanAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionPlan_checklistExecutionId_idx" ON "ActionPlan"("checklistExecutionId");
CREATE INDEX "ActionPlanAttachment_actionPlanId_idx" ON "ActionPlanAttachment"("actionPlanId");

ALTER TABLE "ActionPlan"
  ADD CONSTRAINT "ActionPlan_checklistExecutionId_fkey"
  FOREIGN KEY ("checklistExecutionId") REFERENCES "ChecklistExecution"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ActionPlanAttachment"
  ADD CONSTRAINT "ActionPlanAttachment_actionPlanId_fkey"
  FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
