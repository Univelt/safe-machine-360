import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("uses the Portal Univelt metadata and Brazilian locale", async () => {
  const layout = await source("app/layout.tsx");
  assert.match(layout, /Portal Univelt Machine Safety/);
  assert.match(layout, /lang="pt-BR"/);
  assert.match(layout, /index: false/);
});

test("defines a PostgreSQL schema ready for RDS with tenant keys", async () => {
  const schema = await source("prisma/schema.prisma");
  assert.match(schema, /provider = "postgresql"/);
  assert.match(schema, /model Company/);
  assert.match(schema, /model Machine/);
  assert.match(schema, /companyId/);
  assert.match(schema, /enum UserRole/);
  assert.match(schema, /SUPER_ADMIN/);
  assert.match(schema, /hrnCurrent/);
  assert.match(schema, /model RiskAssessment/);
  assert.match(schema, /model ChecklistTemplate/);
  assert.match(schema, /model ChecklistExecution/);
  assert.match(schema, /model ActionPlan/);
});

test("authenticates admin and company users on the server", async () => {
  const [login, loginApi, middleware, session, seed] = await Promise.all([
    source("app/login/login-form.tsx"),
    source("app/api/auth/login/route.ts"),
    source("middleware.ts"),
    source("lib/auth/session.ts"),
    source("prisma/seed.ts"),
  ]);
  assert.match(login, /\/api\/auth\/login/);
  assert.match(seed, /admin@univelt\.com\.br/);
  assert.match(loginApi, /verifyPassword/);
  assert.match(loginApi, /SESSION_COOKIE/);
  assert.match(middleware, /SUPER_ADMIN/);
  assert.match(middleware, /\/cliente/);
  assert.match(session, /jose/);
  assert.doesNotMatch(login, /sessionStorage/);
});

test("scopes client queries by company and keeps admin global", async () => {
  const [scope, guards, machines] = await Promise.all([
    source("lib/data/scope.ts"),
    source("lib/auth/guards.ts"),
    source("lib/data/machines.ts"),
  ]);
  assert.match(scope, /companyId/);
  assert.match(scope, /isSuperAdmin/);
  assert.match(guards, /requireAdmin/);
  assert.match(machines, /companyFilter\(session\)/);
});

test("provides NR-12 machine cadastro, APR, checklist and action plan", async () => {
  const [form, details, apr, checklist, plan] = await Promise.all([
    source("app/cliente/maquinas/nova/page.tsx"),
    source("app/cliente/maquinas/[id]/machine-details.tsx"),
    source("app/cliente/maquinas/[id]/apr/page.tsx"),
    source("app/cliente/maquinas/[id]/checklist/page.tsx"),
    source("app/cliente/maquinas/[id]/plano/page.tsx"),
  ]);
  assert.match(form, /HRN atual/);
  assert.match(form, /Limite do equipamento/);
  assert.match(details, /Documentos vinculados à máquina/);
  assert.match(details, /MachinePhotos/);
  assert.match(apr, /Número do documento \(APR\)/);
  assert.match(checklist, /Escolha um modelo cadastrado no banco/);
  assert.match(plan, /Não conformidade/);
});

test("imports NR-12 machine spreadsheet with preview before saving", async () => {
  const [parser, action, page, form, list, adminList] = await Promise.all([
    source("lib/import/machine-import-map.ts"),
    source("app/actions/machine-import.ts"),
    source("app/cliente/maquinas/importar/page.tsx"),
    source("app/cliente/maquinas/importar/machine-import-form.tsx"),
    source("app/cliente/maquinas/machines-content.tsx"),
    source("app/admin/maquinas/machines-admin-content.tsx"),
  ]);
  assert.match(parser, /classifyHeader/);
  assert.match(parser, /parseRiskLevel/);
  assert.match(parser, /hrnCurrent/);
  assert.match(action, /previewMachineImportAction/);
  assert.match(action, /confirmMachineImportAction/);
  assert.match(action, /createMany/);
  assert.match(page, /Importar planilha de máquinas/);
  assert.match(form, /Analisar planilha/);
  assert.match(form, /Confirmar cadastro/);
  assert.match(list, /Importar planilha/);
  assert.match(adminList, /Importar planilha/);
  assert.match(list, /paginateItems/);
  assert.match(adminList, /paginateItems/);
});

test("keeps client and Univelt administration separated", async () => {
  const [shell, clientPage, adminPage] = await Promise.all([
    source("app/components/portal-shell.tsx"),
    source("app/cliente/page.tsx"),
    source("app/page.tsx"),
  ]);
  assert.match(shell, /clientNavigation/);
  assert.match(shell, /session\.companyName/);
  assert.match(clientPage, /AuthenticatedShell/);
  assert.match(adminPage, /variant="admin"/);
});

test("lets users add checklist models and items in the database", async () => {
  const [catalog, createPage, editor, fillPage, detail] = await Promise.all([
    source("app/cliente/checklists/page.tsx"),
    source("app/cliente/checklists/novo/page.tsx"),
    source("app/cliente/checklists/checklist-items-editor.tsx"),
    source("app/cliente/maquinas/[id]/checklist/[templateId]/page.tsx"),
    source("app/cliente/checklists/[id]/page.tsx"),
  ]);
  assert.match(catalog, /Novo checklist/);
  assert.match(createPage, /createChecklistTemplateAction/);
  assert.match(editor, /Adicionar item/);
  assert.match(fillPage, /templateId/);
  assert.match(fillPage, /Itens carregados do banco/);
  assert.match(detail, /ChangeLog/);
  assert.match(detail, /Última alteração|ChangeLog/);
});

test("lets users upload photos on an existing machine", async () => {
  const [photos, action, api] = await Promise.all([
    source("app/cliente/maquinas/[id]/machine-photos.tsx"),
    source("app/actions/records.ts"),
    source("app/api/machines/[id]/photos/[photoId]/file/route.ts"),
  ]);
  assert.match(photos, /type="file"/);
  assert.match(photos, /uploadMachinePhotoAction/);
  assert.match(photos, /Adicionar foto/);
  assert.match(photos, /Remover foto/);
  assert.match(action, /saveMachinePhotoUpload/);
  assert.match(action, /deleteMachinePhotoAction/);
  assert.match(api, /companyFilter/);
});

test("lets users attach evidence and update activity progress", async () => {
  const [createPage, evidence, progress, details, action, api] = await Promise.all([
    source("app/cliente/atividades/nova/page.tsx"),
    source("app/cliente/atividades/[id]/activity-evidence.tsx"),
    source("app/cliente/atividades/[id]/activity-progress.tsx"),
    source("app/cliente/atividades/[id]/activity-details.tsx"),
    source("app/actions/records.ts"),
    source("app/api/activities/[id]/attachments/[attachmentId]/file/route.ts"),
  ]);
  assert.match(createPage, /type="file"/);
  assert.match(evidence, /Anexar evidência/);
  assert.match(progress, /updateActivityProgressAction/);
  assert.match(details, /ChangeLog/);
  assert.match(action, /uploadActivityEvidenceAction/);
  assert.match(action, /updateActivityProgressAction/);
  assert.match(api, /companyFilter/);
});

test("lets users attach a file when registering a document", async () => {
  const [form, action, api, details] = await Promise.all([
    source("app/cliente/documentos/novo/page.tsx"),
    source("app/actions/records.ts"),
    source("app/api/documents/[id]/file/route.ts"),
    source("app/cliente/documentos/[id]/document-details.tsx"),
  ]);
  assert.match(form, /type="file"/);
  assert.match(action, /saveDocumentUpload/);
  assert.match(api, /companyFilter/);
  assert.match(details, /hasFile/);
});

test("does not keep demonstration data modules", async () => {
  await assert.rejects(access(new URL("lib/demo-auth.ts", root)));
  await assert.rejects(access(new URL("lib/demo-machines.ts", root)));
  await assert.rejects(access(new URL("app/cliente/demo-client-gate.tsx", root)));
});
