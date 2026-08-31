import type { RiskLevel } from "@prisma/client";
import { riskLabels } from "../labels";

export type MachineImportColumn =
  | "code"
  | "name"
  | "machineType"
  | "sector"
  | "manufacturer"
  | "model"
  | "year"
  | "capacity"
  | "description"
  | "riskLevel"
  | "hrnCurrent"
  | "observations";

export type MachineImportDraft = {
  rowNumber: number;
  code: string;
  name: string;
  tag: string;
  serial: string;
  assetTag: string;
  machineType: string | null;
  manufacturer: string;
  model: string;
  year: number;
  sector: string;
  area: string;
  capacity: string | null;
  riskLevel: RiskLevel;
  hrnCurrent: number;
  description: string;
  observations: string | null;
  warnings: string[];
  existsInCompany: boolean;
  duplicateInFile: boolean;
};

export type MachineImportSkipped = {
  rowNumber: number;
  reason: string;
};

export type MachineImportPreview = {
  sheetName: string;
  mappedColumns: Array<{ header: string; field: MachineImportColumn }>;
  ignoredHeaders: string[];
  skippedRows: MachineImportSkipped[];
  rows: MachineImportDraft[];
};

export const machineImportFieldLabels: Record<MachineImportColumn, string> = {
  code: "Código interno",
  name: "Nome do equipamento",
  machineType: "Tipo de máquina",
  sector: "Setor e área",
  manufacturer: "Fabricante",
  model: "Modelo",
  year: "Ano de fabricação",
  capacity: "Capacidade",
  description: "Descrição / pior risco",
  riskLevel: "Nível de risco",
  hrnCurrent: "HRN atual",
  observations: "Observações",
};

export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[_./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyHeader(header: string): MachineImportColumn | null {
  const h = normalizeHeader(header);
  if (!h) return null;
  if (h === "item" || h.startsWith("item ")) return null;
  if (h.includes("foto") || h.includes("80 20") || h === "80/20") return null;
  if (h.includes("codigo interno") || (h.includes("codigo") && !h.includes("hrn") && !h.includes("documento"))) return "code";
  if (h.includes("nome")) return "name";
  if (h.includes("lote") || (h.includes("tipo") && h.includes("maquina"))) return "machineType";
  if (h.includes("setor") || (h.includes("area") && !h.includes("descr"))) return "sector";
  if (h.includes("fabricante")) return "manufacturer";
  if (h.includes("modelo")) return "model";
  if (h.includes("ano")) return "year";
  if (h.includes("capacidade")) return "capacity";
  if (h.includes("hrn") || h.includes("calculo")) return "hrnCurrent";
  if (h.includes("observ")) return "observations";
  if (h.includes("risco")) {
    if (h.includes("descr")) return "description";
    if (
      h.includes("extremo") ||
      h.includes("signific") ||
      h.includes("insignific") ||
      h.includes("resultado") ||
      h.includes("nivel") ||
      h.includes("classific")
    ) {
      return "riskLevel";
    }
    if (h.includes("pior")) return "description";
    return "riskLevel";
  }
  return null;
}

export function cellToText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.replace(/\r\n/g, "\n").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date && !Number.isNaN(value.getTime())) return String(value.getFullYear());
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("richText" in record && Array.isArray(record.richText)) {
      return cellToText(record.richText.map((part) => (part as { text?: string }).text ?? "").join(""));
    }
    if ("text" in record && record.text != null) return cellToText(record.text);
    if ("result" in record && record.result != null && record.result !== "NULL") return cellToText(record.result);
    if ("error" in record) return "";
    if ("hyperlink" in record && record.text != null) return cellToText(record.text);
  }
  return String(value).trim();
}

export function isUnidentified(value: string) {
  const normalized = normalizeHeader(value);
  return !normalized || normalized === "nao identificado" || normalized === "n a" || normalized === "-" || normalized === "#value!";
}

export function parseYear(value: string) {
  const text = cellToText(value);
  if (isUnidentified(text)) return 0;
  const fullYear = text.match(/(?:^|[^\d])((?:19|20)\d{2})(?:[^\d]|$)/);
  if (fullYear) return Number(fullYear[1]);
  const asNumber = Number(text.replace(",", "."));
  if (Number.isInteger(asNumber) && asNumber >= 1900 && asNumber <= 2100) return asNumber;
  return 0;
}

export function parseHrn(value: string) {
  const text = cellToText(value).replace(",", ".");
  if (isUnidentified(text)) return 0;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function parseRiskLevel(value: string): RiskLevel {
  const h = normalizeHeader(value);
  if (!h) return "SIGNIFICATIVO";
  if (h.includes("extremo") || h.includes("muito alto") || h.includes("critico")) return "MUITO_ALTO";
  if (h.includes("muito baixo") || h.includes("insignific") || h.includes("desprez")) return "MUITO_BAIXO";
  if (h.includes("alto")) return "ALTO";
  if (h.includes("baixo")) return "BAIXO";
  if (h.includes("signific") || h.includes("medio") || h.includes("moderado")) return "SIGNIFICATIVO";
  return "SIGNIFICATIVO";
}

export function extractAssetTag(name: string, fallback: string) {
  const match = name.match(/\(\s*(MQ\s*[-–]?\s*[\w./]+)\s*\)/i);
  if (match) return match[1].replace(/\s+/g, " ").trim();
  return fallback;
}

export function splitSectorArea(value: string) {
  const parts = value
    .split(/\n+|\/|;/g)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { sector: parts[0], area: parts.slice(1).join(" / ") };
  }
  const sector = parts[0] || "Não identificado";
  return { sector, area: sector === "Não identificado" ? "Geral" : sector };
}

function oneLine(value: string) {
  return cellToText(value).replace(/\s+/g, " ").trim();
}

function placeholder(value: string, fallback: string) {
  const text = oneLine(value);
  return isUnidentified(text) ? fallback : text;
}

export function draftFromMappedRow(rowNumber: number, cells: Partial<Record<MachineImportColumn, string>>): MachineImportDraft | null {
  const name = oneLine(cells.name ?? "");
  const code = oneLine(cells.code ?? "");
  if (!name && !code) return null;

  const resolvedCode = code || name;
  const resolvedName = name || code;
  const tag = extractAssetTag(resolvedName, resolvedCode);
  const { sector, area } = splitSectorArea(cells.sector ?? "");
  const manufacturer = placeholder(cells.manufacturer ?? "", "Não identificado");
  const model = placeholder(cells.model ?? "", "Não identificado");
  const capacityText = oneLine(cells.capacity ?? "");
  const description = cellToText(cells.description ?? "") || resolvedName;
  const observations = cellToText(cells.observations ?? "");
  const riskLevel = parseRiskLevel(cells.riskLevel ?? "");
  const year = parseYear(cells.year ?? "");
  const hrnCurrent = parseHrn(cells.hrnCurrent ?? "");
  const warnings: string[] = [];

  if (!code) warnings.push("Código interno ausente; o nome será usado como código.");
  if (year === 0) warnings.push("Ano de fabricação não identificado.");
  if (isUnidentified(cells.manufacturer ?? "")) warnings.push("Fabricante não identificado.");
  if (isUnidentified(cells.model ?? "")) warnings.push("Modelo não identificado.");
  if (!cellToText(cells.riskLevel ?? "")) warnings.push("Nível de risco não informado; será cadastrado como significativo.");

  return {
    rowNumber,
    code: resolvedCode,
    name: resolvedName,
    tag,
    serial: tag,
    assetTag: tag,
    machineType: placeholder(cells.machineType ?? "", "") || null,
    manufacturer,
    model,
    year,
    sector,
    area,
    capacity: isUnidentified(capacityText) ? null : capacityText,
    riskLevel,
    hrnCurrent,
    description,
    observations: observations || null,
    warnings,
    existsInCompany: false,
    duplicateInFile: false,
  };
}

function uniqueImportCode(base: string, used: Set<string>) {
  let suffix = 2;
  let candidate = `${base} (${suffix})`;
  while (used.has(normalizeHeader(candidate))) {
    suffix += 1;
    candidate = `${base} (${suffix})`;
  }
  return candidate;
}

export function applyImportConflicts(rows: MachineImportDraft[], existingCodes: Iterable<string>) {
  const existing = new Set([...existingCodes].map((code) => normalizeHeader(code)));
  const used = new Set(existing);
  const seen = new Map<string, number>();

  return rows.map((row) => {
    const key = normalizeHeader(row.code);
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    const duplicateInFile = count > 0;
    const existsInCompany = !duplicateInFile && existing.has(key);
    const warnings = [...row.warnings];
    let code = row.code;

    if (duplicateInFile) {
      code = uniqueImportCode(row.code, used);
      warnings.push(`Código repetido nesta planilha; será cadastrado como ${code}.`);
    } else if (existsInCompany) {
      warnings.push("Já existe uma máquina com este código nesta empresa; ela não será cadastrada de novo.");
    }

    used.add(normalizeHeader(code));
    return { ...row, code, duplicateInFile, existsInCompany, warnings };
  });
}

export function machineImportSummary(rows: MachineImportDraft[]) {
  return {
    total: rows.length,
    newCount: rows.filter((row) => !row.existsInCompany).length,
    existingCount: rows.filter((row) => row.existsInCompany).length,
    duplicateCount: rows.filter((row) => row.duplicateInFile).length,
    warningCount: rows.filter((row) => row.warnings.length).length,
  };
}

export function riskLabelFor(level: RiskLevel) {
  return riskLabels[level];
}
