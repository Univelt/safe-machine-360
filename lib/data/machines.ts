import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/session";
import { computeDocumentStatus, documentKindLabels, formatDate, machineStatusLabels, riskLabels, riskTones } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { companyFilter } from "./scope";
import type { MachineView } from "./types";
import { getLastPhotoChange } from "./audit";

const machineInclude = {
  company: true,
  unit: true,
  photos: { orderBy: { createdAt: "asc" as const } },
  documents: { orderBy: { issueDate: "desc" as const } },
  riskAssessments: { orderBy: { issuedAt: "desc" as const } },
  checklists: { include: { answers: { include: { item: true } }, template: true }, orderBy: { executedAt: "desc" as const } },
  actionPlans: { include: { items: { orderBy: { sequence: "asc" as const } }, attachments: { where: { fileUrl: { not: null } }, orderBy: { createdAt: "desc" as const } }, checklistExecution: { select: { id: true, template: { select: { name: true } }, executedAt: true } } }, orderBy: { createdAt: "desc" as const } },
  activities: { include: { attachments: true }, orderBy: { dueDate: "asc" as const } },
} satisfies Prisma.MachineInclude;

export type MachineRecord = Prisma.MachineGetPayload<{ include: typeof machineInclude }>;

function documentState(machine: MachineRecord, type: "APRECIACAO_RISCO" | "APR" | "CHECKLIST_SEGURANCA") {
  const match = machine.documents.find((document) => document.type === type || (type === "APRECIACAO_RISCO" && document.type === "APR"));
  if (!match) return { label: "Sem documento", date: "—", status: "SEM_VALIDADE" as const };
  const status = computeDocumentStatus(match.expirationDate);
  const label = status === "VALIDO" ? "Em dia" : status === "A_VENCER" ? "A vencer" : status === "VENCIDO" ? "Vencido" : "Sem documento";
  return { label, date: formatDate(match.expirationDate), status };
}

export function toMachineView(machine: MachineRecord): MachineView {
  const appreciation = documentState(machine, "APRECIACAO_RISCO");
  const checklist = documentState(machine, "CHECKLIST_SEGURANCA");
  return {
    id: machine.id,
    code: machine.code,
    name: machine.name,
    tag: machine.tag,
    sector: machine.sector,
    area: machine.area,
    manufacturer: machine.manufacturer,
    model: machine.model,
    year: machine.year,
    riskLevel: machine.riskLevel,
    riskOrigin: machine.riskOrigin,
    manualRiskLevel: machine.manualRiskLevel,
    risk: riskLabels[machine.riskLevel],
    riskTone: riskTones[machine.riskLevel],
    appreciation: appreciation.label,
    appreciationDate: appreciation.date,
    checklist: checklist.label,
    checklistDate: checklist.date,
    status: machineStatusLabels[machine.status],
    description: machine.description,
    serial: machine.serial,
    energy: machine.energySources,
    hrn: machine.hrnCurrent,
    hrnResidual: machine.hrnResidual,
    category: machine.category,
    assetTag: machine.assetTag,
    machineType: machine.machineType,
    capacity: machine.capacity,
    documentNumber: machine.documentNumber,
    documentRevision: machine.documentRevision,
    equipmentLimits: machine.equipmentLimits,
    observations: machine.observations,
    mainSystems: machine.mainSystems,
    usage: machine.usage,
    processCharacteristics: machine.processCharacteristics,
    operatorCount: machine.operatorCount,
    operatorSkills: machine.operatorSkills,
    mechMaintenanceCount: machine.mechMaintenanceCount,
    mechMaintenanceSkills: machine.mechMaintenanceSkills,
    elecMaintenanceCount: machine.elecMaintenanceCount,
    elecMaintenanceSkills: machine.elecMaintenanceSkills,
    companyId: machine.companyId,
    companyName: machine.company.name,
    unitId: machine.unitId,
    unitName: machine.unit.name,
    photos: machine.photos
      .filter((photo) => photo.url)
      .map((photo) => ({
        id: photo.id,
        kind: photo.kind,
        caption: photo.caption,
        takenAt: photo.takenAt.toISOString(),
        compliant: photo.compliant,
        url: `/api/machines/${machine.id}/photos/${photo.id}/file`,
      })),
    lastPhotoChange: null,
    documents: machine.documents.map((document) => ({
      id: document.id,
      name: document.name,
      type: documentKindLabels[document.type],
      status: computeDocumentStatus(document.expirationDate),
      expirationDate: formatDate(document.expirationDate),
      version: document.version,
      size: document.size,
    })),
    riskAssessments: machine.riskAssessments,
    checklists: machine.checklists,
    actionPlans: machine.actionPlans,
    activities: machine.activities,
  };
}

export async function listMachines(session: SessionUser) {
  const machines = await prisma.machine.findMany({
    where: companyFilter(session),
    include: machineInclude,
    orderBy: [{ riskLevel: "desc" }, { name: "asc" }],
  });
  return machines.map(toMachineView);
}

export async function getMachine(session: SessionUser, id: string) {
  const machine = await prisma.machine.findFirst({
    where: { id, ...companyFilter(session) },
    include: machineInclude,
  });
  if (!machine) return null;
  return { ...toMachineView(machine), lastPhotoChange: await getLastPhotoChange(machine.id) };
}

export async function listCompanies() {
  const companies = await prisma.company.findMany({
    include: { _count: { select: { machines: true, users: true, units: true } }, machines: { select: { documents: { select: { expirationDate: true } } } } },
    orderBy: { name: "asc" },
  });
  return companies.map((company) => {
    const documents = company.machines.flatMap((machine) => machine.documents);
    const valid = documents.filter((document) => computeDocumentStatus(document.expirationDate) === "VALIDO").length;
    const compliance = documents.length ? Math.round((valid / documents.length) * 100) : 0;
    return {
      id: company.id,
      name: company.name,
      legalName: company.legalName,
      cnpj: company.cnpj,
      city: company.city,
      manager: company.manager,
      status: company.status === "ACTIVE" ? "Ativa" : company.status === "DEMO" ? "Demonstração" : "Inativa",
      units: company._count.units,
      machines: company._count.machines,
      users: company._count.users,
      compliance,
    };
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    include: { company: true },
    orderBy: { name: "asc" },
  });
}

export async function listUnits(session: SessionUser, companyId?: string) {
  return prisma.unit.findMany({
    where: { ...companyFilter(session), ...(isSuperAdmin(session) && companyId ? { companyId } : {}) },
    orderBy: { name: "asc" },
  });
}
