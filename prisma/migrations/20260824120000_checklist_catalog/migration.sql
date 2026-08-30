-- AlterTable
ALTER TABLE "ChecklistTemplate" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ChecklistTemplate" ADD COLUMN "description" TEXT;
ALTER TABLE "ChecklistTemplate" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ChecklistTemplate_companyId_idx" ON "ChecklistTemplate"("companyId");

-- AddForeignKey
ALTER TABLE "ChecklistTemplate" ADD CONSTRAINT "ChecklistTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
