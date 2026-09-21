"use server";

import type { MachineStatus, RiskLevel } from "@prisma/client";
import { classifyHrn } from "@/lib/labels";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/guards";
import { canManageCompany, isSuperAdmin } from "@/lib/auth/session";
import {
  applyImportConflicts,
  type MachineImportDraft,
  type MachineImportPreview,
} from "@/lib/import/machine-import-map";
import { prisma } from "@/lib/prisma";

export type MachineImportPreviewResult = {
  companyId: string;
  unitId: string;
  sheetName: string;
  mappedColumns: Array<{ header: string; field: string }>;
  ignoredHeaders: string[];
  skippedRows: Array<{ rowNumber: number; reason: string }>;
  rows: MachineImportDraft[];
};

export type MachineImportConfirmResult = {
  created: number;
  skipped: number;
};

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

async function resolveScope(form: FormData) {
  const session = await requireSession();
  if (!canManageCompany(session)) throw new Error("Somente administradores importam máquinas.");
  const companyId = isSuperAdmin(session) ? text(form, "companyId") : session.companyId;
  if (!companyId) throw new Error("Empresa obrigatória.");
  const unitId = text(form, "unitId");
  const unit = await prisma.unit.findFirst({ where: { id: unitId, companyId } });
  if (!unit) throw new Error("Unidade inválida para a empresa.");
  return { session, companyId, unitId };
}

function parsePreviewPayload(value: string): Omit<MachineImportPreview, "rows"> & { rows: MachineImportDraft[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Não foi possível ler os dados extraídos da planilha.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Não foi possível ler os dados extraídos da planilha.");
  const payload = parsed as Partial<MachineImportPreview>;
  const rows = Array.isArray(payload.rows) ? payload.rows.map(sanitizeDraft).filter((row): row is MachineImportDraft => Boolean(row)) : [];
  if (!rows.length) throw new Error("A planilha não contém máquinas para importar.");
  return {
    sheetName: String(payload.sheetName ?? "Planilha").trim() || "Planilha",
    mappedColumns: Array.isArray(payload.mappedColumns)
      ? payload.mappedColumns.filter((column): column is MachineImportPreview["mappedColumns"][number] => Boolean(column && typeof column === "object" && "header" in column && "field" in column))
      : [],
    ignoredHeaders: Array.isArray(payload.ignoredHeaders) ? payload.ignoredHeaders.map((header) => String(header)) : [],
    skippedRows: Array.isArray(payload.skippedRows)
      ? payload.skippedRows.flatMap((row) => {
          if (!row || typeof row !== "object" || !("rowNumber" in row)) return [];
          return [{ rowNumber: Number(row.rowNumber) || 0, reason: String("reason" in row ? row.reason : "") }];
        })
      : [],
    rows,
  };
}

export async function previewMachineImportAction(formData: FormData): Promise<MachineImportPreviewResult> {
  const { companyId, unitId } = await resolveScope(formData);
  const parsed = parsePreviewPayload(text(formData, "parsed"));
  const existing = await prisma.machine.findMany({
    where: { companyId },
    select: { code: true },
  });
  const rows = applyImportConflicts(parsed.rows, existing.map((machine) => machine.code));

  return {
    companyId,
    unitId,
    sheetName: parsed.sheetName,
    mappedColumns: parsed.mappedColumns,
    ignoredHeaders: parsed.ignoredHeaders,
    skippedRows: parsed.skippedRows,
    rows,
  };
}

function sanitizeDraft(value: unknown): MachineImportDraft | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const code = String(row.code ?? "").trim();
  const name = String(row.name ?? "").trim();
  if (!code || !name) return null;
  const parsedRiskLevel = String(row.riskLevel ?? "SIGNIFICATIVO") as RiskLevel;
  const allowedRisk: RiskLevel[] = ["MUITO_BAIXO", "BAIXO", "SIGNIFICATIVO", "ALTO", "MUITO_ALTO"];
  const year = Number(row.year);
  const hrnCurrent = Number(row.hrnCurrent);
  const hrnText = Number.isFinite(hrnCurrent) ? String(Math.round(hrnCurrent)) : "";
  return {
    rowNumber: Number(row.rowNumber) || 0,
    code,
    name,
    tag: String(row.tag ?? code).trim() || code,
    serial: String(row.serial ?? "Não identificado").trim() || "Não identificado",
    assetTag: String(row.assetTag ?? row.tag ?? code).trim() || code,
    machineType: String(row.machineType ?? "").trim() || null,
    manufacturer: String(row.manufacturer ?? "Não identificado").trim() || "Não identificado",
    model: String(row.model ?? "Não identificado").trim() || "Não identificado",
    year: Number.isFinite(year) ? Math.round(year) : 0,
    sector: String(row.sector ?? "Não identificado").trim() || "Não identificado",
    area: String(row.area ?? "Geral").trim() || "Geral",
    capacity: String(row.capacity ?? "").trim() || null,
    riskLevel: classifyHrn(hrnText) ?? (allowedRisk.includes(parsedRiskLevel) ? parsedRiskLevel : "SIGNIFICATIVO"),
    hrnCurrent: Number.isFinite(hrnCurrent) ? Math.round(hrnCurrent) : 0,
    description: String(row.description ?? name).trim() || name,
    observations: String(row.observations ?? "").trim() || null,
    warnings: Array.isArray(row.warnings) ? row.warnings.map((warning) => String(warning)).filter(Boolean) : [],
    existsInCompany: Boolean(row.existsInCompany),
    duplicateInFile: Boolean(row.duplicateInFile),
  };
}

export async function confirmMachineImportAction(formData: FormData): Promise<MachineImportConfirmResult> {
  const { session, companyId, unitId } = await resolveScope(formData);
  let payload: unknown;
  try {
    payload = JSON.parse(text(formData, "machines"));
  } catch {
    throw new Error("Não foi possível ler as máquinas selecionadas.");
  }
  if (!Array.isArray(payload) || !payload.length) throw new Error("Selecione ao menos uma máquina para cadastrar.");

  const drafts = payload.map(sanitizeDraft).filter((row): row is MachineImportDraft => Boolean(row));
  if (!drafts.length) throw new Error("Nenhuma máquina válida para cadastrar.");

  const existing = await prisma.machine.findMany({
    where: { companyId, code: { in: drafts.map((row) => row.code) } },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((machine) => machine.code));
  const seen = new Set<string>();
  const toCreate: MachineImportDraft[] = [];
  let skipped = 0;

  for (const row of drafts) {
    if (existingCodes.has(row.code) || seen.has(row.code)) {
      skipped += 1;
      continue;
    }
    seen.add(row.code);
    toCreate.push(row);
  }

  if (!toCreate.length) throw new Error("Todas as máquinas selecionadas já existem nesta empresa.");

  await prisma.$transaction(async (tx) => {
    await tx.machine.createMany({
      data: toCreate.map((row) => ({
        companyId,
        unitId,
        code: row.code,
        name: row.name,
        tag: row.tag,
        serial: row.serial,
        assetTag: row.assetTag,
        machineType: row.machineType,
        manufacturer: row.manufacturer,
        model: row.model,
        year: String(row.year),
        sector: row.sector,
        area: row.area,
        capacity: row.capacity,
        hrnCurrent: String(row.hrnCurrent),
        riskLevel: row.riskLevel,
        energySources: "Não informado",
        observations: row.observations,
        status: "OPERACIONAL" as MachineStatus,
        description: row.description,
      })),
      skipDuplicates: true,
    });
    await tx.auditLog.create({
      data: {
        companyId,
        userId: session.id,
        action: "MACHINE_IMPORT",
        operation: "CREATE",
        entity: "Machine",
        entityId: companyId,
        summary: `${toCreate.length} máquina(s) importada(s) da planilha NR-12.`,
      },
    });
  });

  revalidatePath("/cliente/maquinas");
  revalidatePath("/admin/maquinas");
  revalidatePath("/");
  return { created: toCreate.length, skipped };
}
