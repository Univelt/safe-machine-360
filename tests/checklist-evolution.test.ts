import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { checklistExecutionOutcome, compareChecklistAnswers, summarizeChecklistAnswers } from "../lib/checklist-analytics";
import { canManageChecklistTemplate } from "../lib/checklist-permissions";
import { resolveMachineRisk } from "../lib/machine-risk";
import { assertAllowedActionPlanDocument } from "../lib/storage";

const session = (role: "SUPER_ADMIN" | "CLIENT_ADMIN" | "CLIENT_MANAGER" | "VIEWER", companyId: string | null) => ({
  id: "user-1",
  name: "Teste",
  email: "teste@example.com",
  role,
  companyId,
  companyName: null,
  unitId: null,
  unitName: null,
});

test("permissões de catálogo isolam empresas e reservam modelos globais à Univelt", () => {
  assert.equal(canManageChecklistTemplate(session("SUPER_ADMIN", null), null), true);
  assert.equal(canManageChecklistTemplate(session("CLIENT_ADMIN", "empresa-a"), "empresa-a"), true);
  assert.equal(canManageChecklistTemplate(session("CLIENT_MANAGER", "empresa-a"), "empresa-a"), true);
  assert.equal(canManageChecklistTemplate(session("CLIENT_MANAGER", "empresa-a"), "empresa-b"), false);
  assert.equal(canManageChecklistTemplate(session("CLIENT_ADMIN", "empresa-a"), null), false);
  assert.equal(canManageChecklistTemplate(session("VIEWER", "empresa-a"), "empresa-a"), false);
});

test("risco automático continua seguindo o maior HRN informado", () => {
  assert.deepEqual(resolveMachineRisk({ origin: "AUTOMATIC", manualRiskLevel: null, hrnCurrent: "4", hrnResidual: "80" }), {
    riskLevel: "ALTO",
    riskOrigin: "AUTOMATIC",
    manualRiskLevel: null,
  });
});

test("risco manual ignora o HRN sem apagar os valores", () => {
  assert.deepEqual(resolveMachineRisk({ origin: "MANUAL", manualRiskLevel: "MUITO_ALTO", hrnCurrent: "2", hrnResidual: "1" }), {
    riskLevel: "MUITO_ALTO",
    riskOrigin: "MANUAL",
    manualRiskLevel: "MUITO_ALTO",
  });
  assert.throws(() => resolveMachineRisk({ origin: "MANUAL", manualRiskLevel: null, hrnCurrent: "2", hrnResidual: null }), /Selecione/);
});

test("resumo e resultado consideram parcial como não conformidade e excluem N/A do percentual", () => {
  const answers = [{ result: "SIM" as const }, { result: "NAO" as const }, { result: "PARCIAL" as const }, { result: "NA" as const }];
  assert.deepEqual(summarizeChecklistAnswers(answers, 5), { yes: 1, no: 2, na: 1, applicable: 3, missing: 1, compliance: 33 });
  assert.equal(checklistExecutionOutcome(answers.map((answer) => answer.result)), "NAO_CONFORME");
  assert.equal(checklistExecutionOutcome(["SIM", "NA"]), "CONFORME");
});

test("comparativo identifica melhora, piora e reincidência pelo mesmo item", () => {
  const previous = [
    { itemId: "a", result: "NAO" as const, item: { description: "Proteção" } },
    { itemId: "b", result: "SIM" as const, item: { description: "Parada" } },
    { itemId: "c", result: "PARCIAL" as const, item: { description: "Sinalização" } },
  ];
  const current = [
    { itemId: "a", result: "SIM" as const, item: { description: "Proteção" } },
    { itemId: "b", result: "NAO" as const, item: { description: "Parada" } },
    { itemId: "c", result: "NAO" as const, item: { description: "Sinalização" } },
  ];
  assert.deepEqual(compareChecklistAnswers(current, previous), { improved: ["Proteção"], worsened: ["Parada", "Sinalização"], recurring: ["Sinalização"] });
});

test("anexo de plano exige extensão e MIME compatíveis", () => {
  const valid = new File(["pdf"], "evidencia.pdf", { type: "application/pdf" });
  assert.equal(assertAllowedActionPlanDocument(valid), "PDF");
  const disguised = new File(["pdf"], "evidencia.docx", { type: "application/pdf" });
  assert.throws(() => assertAllowedActionPlanDocument(disguised), /PDF, DOC ou DOCX/);
});

test("migração é aditiva e mantém máquinas existentes no modo automático", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260921190000_checklist_risk_plan_evolution/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /DEFAULT 'AUTOMATIC'/);
  assert.match(sql, /CREATE TABLE "ActionPlanAttachment"/);
  assert.doesNotMatch(sql, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i);
});
