import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { isUnassignedMachineCode } from "../lib/machine-code";
import { parseMachineCsv } from "../lib/import/machine-csv";
import { applyImportConflicts, sanitizeMachineImportDraft } from "../lib/import/machine-import-map";

test("only N/A is exempt from code uniqueness, including case and outer spaces", () => {
  for (const value of ["N/A", "n/a", " N/A "]) assert.equal(isUnassignedMachineCode(value), true);
  for (const value of ["", "NA", "N/A-01", "N/A (2)", "PLANTA ALTA", "EBI-01"]) assert.equal(isUnassignedMachineCode(value), false);
});

test("spreadsheet preserves location and maintenance text and does not rename or skip repeated N/A", () => {
  const parsed = parseMachineCsv([
    "Código interno;Nome da máquina;Setor;Fabricante;Localização;Manutenção mecânica;Manutenção elétrica",
    "N/A;Inspetora 1;Envase;Fabricante;Planta Alta;Equipe própria;Empresa contratada",
    "n/a;Inspetora 2;Envase;Fabricante;Planta Baixa;N/A;0",
    "EBI-01;Inspetora 3;Envase;Fabricante;;;;",
  ].join("\n"));
  const rows = applyImportConflicts(parsed.rows, ["N/A", "EBI-01"]);
  assert.deepEqual(rows.slice(0, 2).map(row => [row.code, row.existsInCompany, row.duplicateInFile]), [["N/A", false, false], ["n/a", false, false]]);
  assert.equal(rows[2].existsInCompany, true);
  const sanitized = sanitizeMachineImportDraft(JSON.parse(JSON.stringify(rows[0])));
  assert.equal(sanitized?.location, "Planta Alta");
  assert.equal(sanitized?.mechMaintenanceCount, "Equipe própria");
  assert.equal(sanitized?.elecMaintenanceCount, "Empresa contratada");
  assert.equal(sanitizeMachineImportDraft(rows[1])?.elecMaintenanceCount, "0");
  assert.equal(sanitizeMachineImportDraft(rows[2])?.location, null);
});

test("PostgreSQL migrations preserve machines, protect real codes and accept category text", async () => {
  const db = new PGlite();
  try {
    const migrations = join(process.cwd(), "prisma/migrations");
    const target = "20261005120000_machine_location_maintenance_text";
    for (const migration of (await readdir(migrations, { withFileTypes: true })).filter(entry => entry.isDirectory() && entry.name < target).sort((a, b) => a.name.localeCompare(b.name))) {
      await db.exec(await readFile(join(migrations, migration.name, "migration.sql"), "utf8"));
    }
    await db.exec(`INSERT INTO "Company" (id, name, "legalName", cnpj, city, manager, "updatedAt") VALUES ('a','Empresa A','Empresa A','a','São Paulo','Equipe',NOW()), ('b','Empresa B','Empresa B','b','São Paulo','Equipe',NOW());
      INSERT INTO "Unit" (id,"companyId",name,city) VALUES ('ua','a','Matriz','São Paulo'), ('ub','b','Matriz','São Paulo');`);
    async function insert(id: string, code: string, companyId = "a") {
      await db.query(`INSERT INTO "Machine" (id,"companyId","unitId",code,name,tag,serial,manufacturer,model,year,sector,area,"hrnCurrent","riskLevel","energySources",description,"updatedAt") VALUES ($1,$2,$3,$4,'Inspetora','TAG','Série','Fabricante','Modelo','2020','Envase','Linha','5','BAIXO','Elétrica','Dados existentes',NOW())`, [id, companyId, companyId === "a" ? "ua" : "ub", code]);
    }
    await insert("legacy", "EBI-01");
    await insert("unassigned", "N/A");
    await db.exec(`UPDATE "Machine" SET "mechMaintenanceCount"=2, "elecMaintenanceCount"=0 WHERE id='legacy';`);
    await db.exec(await readFile(join(migrations, target, "migration.sql"), "utf8"));
    const preserved = await db.query<{ code: string; mech: string; elec: string; location: null; description: string }>(`SELECT code,"mechMaintenanceCount" AS mech,"elecMaintenanceCount" AS elec,location,description FROM "Machine" WHERE id='legacy'`);
    assert.deepEqual(preserved.rows[0], { code: "EBI-01", mech: "2", elec: "0", location: null, description: "Dados existentes" });
    await insert("na2", "N/A");
    await insert("na3", "N/A");
    await insert("na4", " n/a ");
    await assert.rejects(insert("duplicate", "EBI-01"), error => (error as { code?: string }).code === "23505");
    await insert("other-company", "EBI-01", "b");
    await db.exec(`UPDATE "Machine" SET location='Planta Alta',"mechMaintenanceCount"='Equipe própria',"elecMaintenanceCount"='Terceirizada' WHERE id='legacy';`);
    const updated = await db.query<{ location: string; mech: string; elec: string }>(`SELECT location,"mechMaintenanceCount" AS mech,"elecMaintenanceCount" AS elec FROM "Machine" WHERE id='legacy'`);
    assert.deepEqual(updated.rows[0], { location: "Planta Alta", mech: "Equipe própria", elec: "Terceirizada" });
    await assert.rejects(db.exec(`UPDATE "Machine" SET code='EBI-01' WHERE id='na2'`), error => (error as { code?: string }).code === "23505");
    await db.exec(`UPDATE "Machine" SET code='N/A' WHERE id='legacy';`);
    assert.equal((await db.query<{ count: number }>(`SELECT COUNT(*)::integer AS count FROM "Machine"`)).rows[0].count, 6);
    await db.exec(`UPDATE "Machine" SET category = CASE id
      WHEN 'legacy' THEN 'B'::"SafetyCategory"
      WHEN 'unassigned' THEN 'CAT_1'::"SafetyCategory"
      WHEN 'na2' THEN 'CAT_2'::"SafetyCategory"
      WHEN 'na3' THEN 'CAT_3'::"SafetyCategory"
      WHEN 'na4' THEN 'CAT_4'::"SafetyCategory"
      ELSE NULL END;`);
    await db.exec(await readFile(join(migrations, "20261005140000_machine_category_text", "migration.sql"), "utf8"));
    const categories = await db.query<{ id: string; category: string | null }>(`SELECT id,category FROM "Machine" ORDER BY id`);
    assert.deepEqual(categories.rows, [
      { id: "legacy", category: "B" },
      { id: "na2", category: "2" },
      { id: "na3", category: "3" },
      { id: "na4", category: "4" },
      { id: "other-company", category: null },
      { id: "unassigned", category: "1" },
    ]);
    await db.query(`UPDATE "Machine" SET category=$1 WHERE id='legacy'`, ["Categoria especial — N/A"]);
    assert.equal((await db.query<{ category: string }>(`SELECT category FROM "Machine" WHERE id='legacy'`)).rows[0].category, "Categoria especial — N/A");
    const assessmentType = await db.query<{ udt_name: string }>(`SELECT udt_name FROM information_schema.columns WHERE table_name='RiskAssessment' AND column_name='category'`);
    assert.equal(assessmentType.rows[0].udt_name, "SafetyCategory");
  } finally { await db.close(); }
});
