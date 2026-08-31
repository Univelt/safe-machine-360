import type { ActivityPriority, ActivityStatus, ChecklistAnswer, DocumentKind, DocumentStatus, MachineStatus, RiskLevel, SafetyCategory, UserRole } from "@prisma/client";

export const riskLabels: Record<RiskLevel, string> = {
  MUITO_BAIXO: "Muito baixo",
  BAIXO: "Baixo",
  SIGNIFICATIVO: "Significativo",
  ALTO: "Alto",
  MUITO_ALTO: "Muito alto",
};

export const riskTones: Record<RiskLevel, string> = {
  MUITO_BAIXO: "risk-very-low",
  BAIXO: "risk-low",
  SIGNIFICATIVO: "risk-medium",
  ALTO: "risk-high",
  MUITO_ALTO: "risk-critical",
};

export const machineStatusLabels: Record<MachineStatus, string> = {
  OPERACIONAL: "Operacional",
  EM_MANUTENCAO: "Em manutenção",
  INTERDITADA: "Interditada",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  VALIDO: "Válido",
  A_VENCER: "A vencer",
  VENCIDO: "Vencido",
  SEM_VALIDADE: "Sem validade",
};

export const documentKindLabels: Record<DocumentKind, string> = {
  APRECIACAO_RISCO: "Apreciação de risco",
  CHECKLIST_SEGURANCA: "Checklist de segurança",
  CHECKLIST_MANUTENCAO: "Checklist de manutenção",
  MANUAL: "Manual",
  LAUDO: "Laudo",
  ART: "ART",
  APR: "APR",
  OUTRO: "Outro",
};

export const activityStatusLabels: Record<ActivityStatus, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  ATRASADA: "Atrasada",
};

export const activityPriorityLabels: Record<ActivityPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin Univelt",
  CLIENT_ADMIN: "Admin Cliente",
  CLIENT_MANAGER: "Gestor Cliente",
  VIEWER: "Visualizador",
};

export const checklistAnswerLabels: Record<ChecklistAnswer, string> = {
  SIM: "Sim",
  NAO: "Não",
  PARCIAL: "Parcial",
  NA: "N/A",
};

export const checklistAnswerTones: Record<ChecklistAnswer, string> = {
  SIM: "ok",
  NAO: "fail",
  PARCIAL: "warn",
  NA: "muted",
};

export const categoryLabels: Record<SafetyCategory, string> = {
  B: "B",
  CAT_1: "1",
  CAT_2: "2",
  CAT_3: "3",
  CAT_4: "4",
};

export const photoKindLabels = {
  FRONT: "Frontal",
  BACK: "Traseira",
  LEFT: "Lateral esquerda",
  RIGHT: "Lateral direita",
  ELECTRICAL_PANEL: "Painel elétrico principal",
  ID_PLATE: "Placa de identificação",
  OTHER: "Outra",
} as const;

export function documentTone(status: DocumentStatus | string) {
  const value = String(status);
  if (value === "VALIDO" || value === "Em dia" || value === "Válido") return "valid";
  if (value === "A_VENCER" || value === "A vencer") return "warning";
  if (value === "SEM_VALIDADE" || value === "Sem validade" || value === "Sem documento") return "neutral";
  return "danger";
}

export function computeDocumentStatus(expirationDate: Date | null, now = new Date()): DocumentStatus {
  if (!expirationDate) return "SEM_VALIDADE";
  const diffDays = Math.ceil((expirationDate.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return "VENCIDO";
  if (diffDays <= 30) return "A_VENCER";
  return "VALIDO";
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
