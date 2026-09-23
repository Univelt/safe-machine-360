import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
  applyImportConflicts,
  classifyHeader,
  draftFromMappedRow,
  extractAssetTag,
  parseRiskLevel,
  parseYear,
  splitSectorArea,
} from "../lib/import/machine-import-map";
import { parseMachineSpreadsheet } from "../lib/import/machine-spreadsheet";
import { parseCsvToGrid, parseMachineCsv } from "../lib/import/machine-csv";
import { classifyHrn, classifyHrnPair } from "../lib/labels";

test("classifies integer and decimal HRN values using the current risk table", () => {
  assert.equal(classifyHrn(""), null);
  assert.equal(classifyHrn("abc"), null);
  assert.equal(classifyHrn("0"), "DESPREZIVEL");
  assert.equal(classifyHrn("1"), "DESPREZIVEL");
  assert.equal(classifyHrn("1,1"), "MUITO_BAIXO");
  assert.equal(classifyHrn("5"), "MUITO_BAIXO");
  assert.equal(classifyHrn("5.5"), "BAIXO");
  assert.equal(classifyHrn("10"), "BAIXO");
  assert.equal(classifyHrn("10,01"), "SIGNIFICATIVO");
  assert.equal(classifyHrn("50"), "SIGNIFICATIVO");
  assert.equal(classifyHrn("51"), "ALTO");
  assert.equal(classifyHrn("100"), "ALTO");
  assert.equal(classifyHrn("100.5"), "MUITO_ALTO");
  assert.equal(classifyHrn("500"), "MUITO_ALTO");
  assert.equal(classifyHrn("501"), "EXTREMO");
  assert.equal(classifyHrn("1000"), "EXTREMO");
  assert.equal(classifyHrn("1000,01"), "INACEITAVEL");
  assert.equal(classifyHrnPair("4", "600"), "EXTREMO");
});

test("classifies NR-12 spreadsheet headers onto Machine fields", () => {
  assert.equal(classifyHeader("CÓDIGO INTERNO"), "code");
  assert.equal(classifyHeader("NOME DA MÁQUINA/EQUIPAMENTO"), "name");
  assert.equal(classifyHeader("LOTE"), "machineType");
  assert.equal(classifyHeader("SETOR (ÁREA)"), "sector");
  assert.equal(classifyHeader("FABRICANTE"), "manufacturer");
  assert.equal(classifyHeader("MODELO"), "model");
  assert.equal(classifyHeader("ANO DE FABRICAÇÃO"), "year");
  assert.equal(classifyHeader("CAPACIDADE"), "capacity");
  assert.equal(classifyHeader("PIOR RISCO ENCONTRADO (DESCRIÇÃO)"), "description");
  assert.equal(classifyHeader("Pior risco encontrado (Extremo, Alto, Significante, Baixo, insignificante)"), "riskLevel");
  assert.equal(classifyHeader("Cálculo HRN"), "hrnCurrent");
  assert.equal(classifyHeader("OBSERVAÇÕES"), "observations");
  assert.equal(classifyHeader("FOTO MÁQUINA (PRINCIPAL)"), null);
  assert.equal(classifyHeader("ITEM"), null);
});

test("maps risk labels, year fragments and MQ tags", () => {
  assert.equal(parseRiskLevel("RISCO INACEITÁVEL"), "INACEITAVEL");
  assert.equal(parseRiskLevel("RISCO EXTREMO"), "EXTREMO");
  assert.equal(parseRiskLevel("RISCO MUITO ALTO"), "MUITO_ALTO");
  assert.equal(parseRiskLevel("RISCO DESPREZÍVEL"), "DESPREZIVEL");
  assert.equal(parseRiskLevel("RISCO ALTO"), "ALTO");
  assert.equal(parseRiskLevel("RISCO SIGNIFICANTE"), "SIGNIFICATIVO");
  assert.equal(parseRiskLevel("RISCO BAIXO"), "BAIXO");
  assert.equal(parseYear("05/1999"), 1999);
  assert.equal(parseYear("NÃO IDENTIFICADO"), 0);
  assert.equal(extractAssetTag("PRE - 030 (MQ - 337)", "ASSA ABLOY - 001"), "MQ - 337");
  assert.deepEqual(splitSectorArea("ESTAMPARIA\nFUNDO DA LINHA"), { sector: "ESTAMPARIA", area: "FUNDO DA LINHA" });
});

test("parses the Assa Abloy NR-12 workbook when the file is present", async () => {
  const workbook = resolve(process.cwd(), "PLANILHA NR 12 - ASSA ABLOY ATUALIZADA.xlsx");
  if (!existsSync(workbook)) return;
  const parsed = await parseMachineSpreadsheet(await readFile(workbook));
  assert.equal(parsed.sheetName, "Levantamento Inicial Assabloy");
  assert.equal(parsed.rows.length, 120);
  assert.equal(parsed.rows[0]?.code, "ASSA ABLOY - 001");
  assert.equal(parsed.rows[0]?.name, "PRE - 030 (MQ - 337)");
  assert.equal(parsed.rows[0]?.tag, "MQ - 337");
  assert.equal(parsed.rows[0]?.machineType, "PRENSA");
  assert.equal(parsed.rows[0]?.riskLevel, "ALTO");
  assert.deepEqual(
    parsed.mappedColumns.map((column) => column.field),
    ["code", "name", "machineType", "sector", "manufacturer", "model", "year", "capacity", "description", "riskLevel", "hrnCurrent", "observations"],
  );
});

test("parses NR-12 CSV with semicolon delimiter", () => {
  const csv = [
    "ITEM;CÓDIGO INTERNO;NOME DA MÁQUINA/EQUIPAMENTO;LOTE;SETOR (ÁREA);FABRICANTE;MODELO;ANO DE FABRICAÇÃO",
    "1;ASSA ABLOY - 001;PRE - 030 (MQ - 337);PRENSA;ESTAMPARIA;NÃO IDENTIFICADO;PRENSA - JUNDIAÍ 135T;1999",
  ].join("\n");
  const parsed = parseMachineCsv(csv, "maquinas.csv");
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.code, "ASSA ABLOY - 001");
  assert.equal(parsed.rows[0]?.name, "PRE - 030 (MQ - 337)");
  assert.equal(parsed.rows[0]?.machineType, "PRENSA");
  assert.equal(parseCsvToGrid(csv)[1]?.[1], "ASSA ABLOY - 001");
});

test("builds a machine draft and flags codes that already exist", () => {
  const draft = draftFromMappedRow(4, {
    code: "ASSA ABLOY - 001",
    name: "PRE - 030 (MQ - 337)",
    machineType: "PRENSA",
    sector: "ESTAMPARIA",
    manufacturer: "NÃO IDENTIFICADO",
    model: "PRENSA - JUNDIAÍ 135T",
    year: "NÃO IDENTIFICADO",
    capacity: "135 TOLENADAS",
    description: "Prensa sem sistema de intertravamento.",
    riskLevel: "RISCO ALTO",
  });
  assert.ok(draft);
  assert.equal(draft?.tag, "MQ - 337");
  assert.equal(draft?.riskLevel, "ALTO");
  assert.equal(draft?.sector, "ESTAMPARIA");
  assert.equal(draft?.year, 0);
  const [existing] = applyImportConflicts([draft!], ["ASSA ABLOY - 001"]);
  assert.equal(existing.existsInCompany, true);
  assert.match(existing.warnings.join(" "), /Já existe/);
  assert.match(existing.warnings.join(" "), /não será cadastrada/);
});
