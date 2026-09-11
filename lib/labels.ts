import type { ActivityPriority, ActivityStatus, ChecklistAnswer, DocumentKind, DocumentStatus, MachineStatus, RiskLevel, SafetyCategory, UserRole } from "@prisma/client";

export const riskLabels: Record<RiskLevel, string> = {
  MUITO_BAIXO: "Baixo",
  BAIXO: "Baixo",
  SIGNIFICATIVO: "Médio",
  ALTO: "Alto",
  MUITO_ALTO: "Muito alto",
};

export const riskTones: Record<RiskLevel, string> = {
  MUITO_BAIXO: "risk-low",
  BAIXO: "risk-low",
  SIGNIFICATIVO: "risk-medium",
  ALTO: "risk-high",
  MUITO_ALTO: "risk-critical",
};

const riskRank: Record<RiskLevel, number> = {
  MUITO_BAIXO: 0,
  BAIXO: 0,
  SIGNIFICATIVO: 1,
  ALTO: 2,
  MUITO_ALTO: 3,
};

export function parseHrnValue(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function classifyHrn(value: unknown): RiskLevel | null {
  const hrn = parseHrnValue(value);
  if (hrn === null) return null;
  if (hrn <= 5) return "BAIXO";
  if (hrn <= 50) return "SIGNIFICATIVO";
  if (hrn <= 500) return "ALTO";
  return "MUITO_ALTO";
}

export function classifyHrnPair(current: unknown, residual?: unknown): RiskLevel | null {
  const levels = [classifyHrn(current), classifyHrn(residual)
