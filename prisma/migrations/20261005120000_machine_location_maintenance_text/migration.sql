BEGIN;

-- Keep existing machines and preserve numeric maintenance values as text.
ALTER TABLE "Machine"
  ADD COLUMN "location" TEXT,
  ALTER COLUMN "mechMaintenanceCount" TYPE TEXT USING "mechMaintenanceCount"::TEXT,
  ALTER COLUMN "elecMaintenanceCount" TYPE TEXT USING "elecMaintenanceCount"::TEXT;

-- Only N/A is repeatable; actual internal codes remain unique within a company.
-- Replacing the index within this transaction leaves no unprotected write window.
DROP INDEX "Machine_companyId_code_key";
CREATE UNIQUE INDEX "Machine_companyId_code_key"
  ON "Machine" ("companyId", "code")
  WHERE UPPER(BTRIM("code")) <> 'N/A';

COMMIT;
