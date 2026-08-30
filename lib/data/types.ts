import type { ChecklistAnswer, PhotoKind, RiskLevel, SafetyCategory } from "@prisma/client";

export type MachinePhotoView = {
  id: string;
  kind: PhotoKind;
  url: string | null;
  caption: string;
};

export type MachineDocumentView = {
  id: string;
  name: string;
  type: string;
  status: "VALIDO" | "A_VENCER" | "VENCIDO" | "SEM_VALIDADE";
  expirationDate: string;
  version: string;
  size: string | null;
};

export type MachineView = {
  id: string;
  code: string;
  name: string;
  tag: string;
  sector: string;
  area: string;
  manufacturer: string;
  model: string;
  year: number;
  risk: string;
  riskTone: string;
  appreciation: string;
  appreciationDate: string;
  checklist: string;
  checklistDate: string;
  status: string;
  description: string;
  serial: string;
  energy: string;
  hrn: number;
  hrnResidual: number | null;
  category: SafetyCategory | null;
  assetTag: string | null;
  machineType: string | null;
  capacity: string | null;
  documentNumber: string | null;
  documentRevision: string | null;
  equipmentLimits: string | null;
  observations: string | null;
  mainSystems: string | null;
  usage: string | null;
  processCharacteristics: string | null;
  operatorCount: number | null;
  operatorSkills: string | null;
  mechMaintenanceCount: number | null;
  mechMaintenanceSkills: string | null;
  elecMaintenanceCount: number | null;
  elecMaintenanceSkills: string | null;
  companyId: string;
  companyName: string;
  unitName: string;
  photos: MachinePhotoView[];
  documents: MachineDocumentView[];
  riskAssessments: Array<{
    id: string;
    documentNumber: string;
    revision: string;
    category: SafetyCategory;
    hrnCurrent: number;
    hrnResidual: number;
    riskLevel: RiskLevel;
    issuedAt: Date;
    expiresAt: Date | null;
    notes: string | null;
  }>;
  checklists: Array<{
    id: string;
    executedAt: Date;
    executedBy: string;
    notes: string | null;
    template: { id: string; name: string };
    answers: Array<{ id: string; result: ChecklistAnswer; item: { number: number; description: string } }>;
  }>;
  actionPlans: Array<{
    id: string;
    title: string;
    items: Array<{ id: string; sequence: number; location: string; nonconformity: string; action: string; responsible: string }>;
  }>;
  activities: Array<{
    id: string;
    title: string;
    status: string;
    responsible: string;
    responsibleEmail: string | null;
    dueDate: Date;
  }>;
};

export type DocumentView = {
  id: string;
  name: string;
  type: string;
  machineId: string;
  machine: string;
  machineCode: string;
  version: string;
  issueDate: string;
  expirationDate: string;
  daysLeft: number | null;
  status: string;
  statusKey: string;
  responsible: string;
  format: string;
  size: string;
  description: string;
  fileUrl: string | null;
  hasFile: boolean;
};

export type ActivityView = {
  id: string;
  title: string;
  type: string;
  machineId: string;
  machine: string;
  machineCode: string;
  description: string;
  responsible: string;
  responsibleEmail: string | null;
  createdAt: string;
  dueDate: string;
  executedAt: string;
  status: string;
  statusKey: string;
  priority: string;
  progress: number;
  evidenceCount: number;
  attachments: Array<{ id: string; name: string; kind: string; url: string | null }>;
};

export type CompanyView = {
  id: string;
  name: string;
  legalName: string;
  cnpj: string;
  city: string;
  manager: string;
  status: string;
  units: number;
  machines: number;
  users: number;
  compliance: number;
};
