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

export const riskLevelOptions = [...new Map(
  Object.entries(riskLabels).map(([value, label]) => [label, { value: value as RiskLevel, label }]),
).values()];

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
  const levels = [classifyHrn(current), classifyHrn(residual)].filter((level): level is RiskLevel => Boolean(level));
  if (!levels.length) return null;
  return levels.reduce((highest, level) => (riskRank[level] > riskRank[highest] ? level : highest));
}

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

export const auditActionLabels: Record<string, string> = {
  COMPANY_CREATED: "Empresa cadastrada",
  USER_CREATED: "Usuário cadastrado",
  MACHINE_CREATED: "Máquina cadastrada",
  MACHINE_UPDATED: "Máquina atualizada",
  MACHINE_DELETED: "Máquina excluída",
  MACHINE_PHOTO_UPLOADED: "Fotos adicionadas",
  MACHINE_PHOTO_DELETED: "Foto removida",
  DOCUMENT_CREATED: "Documento cadastrado",
  ACTIVITY_CREATED: "Atividade cadastrada",
  ACTIVITY_PROGRESS_UPDATED: "Progresso atualizado",
  ACTIVITY_EVIDENCE_UPLOADED: "Evidência adicionada",
  ACTIVITY_EVIDENCE_DELETED: "Evidência removida",
  APR_CREATED: "Apreciação de risco cadastrada",
  CHECKLIST_TEMPLATE_CREATED: "Modelo de checklist cadastrado",
  CHECKLIST_ITEM_ADDED: "Item de checklist adicionado",
  CHECKLIST_TEMPLATE_UPDATED: "Modelo de checklist atualizado",
  CHECKLIST_TEMPLATE_ARCHIVED: "Modelo de checklist desativado",
  CHECKLIST_TEMPLATE_RESTORED: "Modelo de checklist reativado",
  CHECKLIST_TEMPLATE_DELETED: "Modelo de checklist excluído",
  CHECKLIST_ITEM_UPDATED: "Item de checklist atualizado",
  CHECKLIST_ITEM_ARCHIVED: "Item de checklist desativado",
  CHECKLIST_ITEM_RESTORED: "Item de checklist reativado",
  CHECKLIST_ITEM_DELETED: "Item de checklist excluído",
  CHECKLIST_CREATED: "Checklist preenchido",
  MACHINE_IMPORT: "Máquinas importadas",
  ACTION_PLAN_CREATED: "Plano de ação cadastrado",
  ACTION_PLAN_ATTACHMENT_ADDED: "Documento do plano anexado",
  ACTION_PLAN_ATTACHMENT_DELETED: "Documento do plano removido",
};

export const auditEntityLabels: Record<string, string> = {
  Company: "Empresa",
  User: "Usuário",
  Machine: "Máquina",
  MachinePhoto: "Foto da máquina",
  Document: "Documento",
  Activity: "Atividade",
  ActivityAttachment: "Evidência da atividade",
  RiskAssessment: "Apreciação de risco",
  ChecklistTemplate: "Modelo de checklist",
  ChecklistTemplateItem: "Item de checklist",
  ChecklistExecution: "Checklist preenchido",
  ActionPlan: "Plano de ação",
  ActionPlanAttachment: "Documento do plano",
};

export function humanizeAuditCode(value: string) {
  return value
    .replaceAll("_", " ")
    .toLocaleLowerCase("pt-BR")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

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
