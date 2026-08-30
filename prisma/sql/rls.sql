-- Isolamento por empresa no PostgreSQL (RDS ou local).
-- A aplicação continua filtrando por company_id; estas policies são defesa extra.
-- Execute após `prisma migrate deploy` se quiser ativar RLS no banco.

ALTER TABLE "Machine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiskAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChecklistExecution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActionPlan" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS machine_tenant ON "Machine";
CREATE POLICY machine_tenant ON "Machine"
  USING (
    current_setting('app.user_role', true) = 'SUPER_ADMIN'
    OR company_id = current_setting('app.company_id', true)
  );

DROP POLICY IF EXISTS document_tenant ON "Document";
CREATE POLICY document_tenant ON "Document"
  USING (
    current_setting('app.user_role', true) = 'SUPER_ADMIN'
    OR company_id = current_setting('app.company_id', true)
  );

DROP POLICY IF EXISTS activity_tenant ON "Activity";
CREATE POLICY activity_tenant ON "Activity"
  USING (
    current_setting('app.user_role', true) = 'SUPER_ADMIN'
    OR company_id = current_setting('app.company_id', true)
  );

DROP POLICY IF EXISTS risk_tenant ON "RiskAssessment";
CREATE POLICY risk_tenant ON "RiskAssessment"
  USING (
    current_setting('app.user_role', true) = 'SUPER_ADMIN'
    OR company_id = current_setting('app.company_id', true)
  );

DROP POLICY IF EXISTS checklist_tenant ON "ChecklistExecution";
CREATE POLICY checklist_tenant ON "ChecklistExecution"
  USING (
    current_setting('app.user_role', true) = 'SUPER_ADMIN'
    OR company_id = current_setting('app.company_id', true)
  );

DROP POLICY IF EXISTS action_plan_tenant ON "ActionPlan";
CREATE POLICY action_plan_tenant ON "ActionPlan"
  USING (
    current_setting('app.user_role', true) = 'SUPER_ADMIN'
    OR company_id = current_setting('app.company_id', true)
  );
