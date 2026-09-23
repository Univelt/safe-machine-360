import type { SessionUser } from "@/lib/auth/session";
import { computeDocumentStatus, documentKindLabels, documentStatusLabels, formatDate, formatDateTime } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getLastChange } from "./audit";
import { companyFilter } from "./scope";

export async function listDocuments(session: SessionUser) {
  const documents = await prisma.document.findMany({
    where: companyFilter(session),
    include: { machine: true },
    orderBy: [{ expirationDate: "asc" }, { name: "asc" }],
  });
  return documents.map((document) => {
    const status = computeDocumentStatus(document.expirationDate);
    const daysLeft = document.expirationDate
      ? Math.ceil((document.expirationDate.getTime() - Date.now()) / 86_400_000)
      : null;
    return {
      id: document.id,
      name: document.name,
      type: documentKindLabels[document.type],
      machineId: document.machineId,
      machine: document.machine.name,
      machineCode: document.machine.code,
      version: document.version,
      issueDate: formatDate(document.issueDate),
      expirationDate: formatDate(document.expirationDate),
      daysLeft,
      status: documentStatusLabels[status],
      statusKey: status,
      responsible: document.responsible,
      format: document.format,
      size: document.size ?? "—",
      description: document.description,
      fileUrl: document.fileUrl,
      hasFile: Boolean(document.fileUrl),
    };
  });
}

export async function getDocument(session: SessionUser, id: string) {
  const documents = await listDocuments(session);
  return documents.find((document) => document.id === id) ?? null;
}

export async function listActivities(session: SessionUser) {
  const activities = await prisma.activity.findMany({
    where: companyFilter(session),
    include: { machine: true, attachments: true },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
  return activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    type: activity.type,
    machineId: activity.machineId,
    machine: activity.machine.name,
    machineCode: activity.machine.code,
    description: activity.description,
    responsible: activity.responsible,
    responsibleEmail: activity.responsibleEmail,
    createdAt: formatDate(activity.createdOn),
    dueDate: formatDate(activity.dueDate),
    executedAt: formatDate(activity.executedAt),
    status: activity.status === "ABERTA" ? "Aberta" : activity.status === "EM_ANDAMENTO" ? "Em andamento" : activity.status === "CONCLUIDA" ? "Concluída" : "Atrasada",
    statusKey: activity.status,
    priority: activity.priority === "BAIXA" ? "Baixa" : activity.priority === "MEDIA" ? "Média" : activity.priority === "ALTA" ? "Alta" : "Crítica",
    progress: activity.progress,
    evidenceCount: activity.attachments.length,
    attachments: activity.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      kind: attachment.kind,
      url: attachment.url ? `/api/activities/${activity.id}/attachments/${attachment.id}/file` : null,
    })),
    lastChange: null as { at: string; by: string } | null,
  }));
}

export async function getActivity(session: SessionUser, id: string) {
  const activities = await listActivities(session);
  const activity = activities.find((item) => item.id === id) ?? null;
  if (!activity) return null;
  const lastChange = await getLastChange("Activity", id);
  if (lastChange) return { ...activity, lastChange: { at: lastChange.at, by: lastChange.by } };
  const record = await prisma.activity.findUnique({ where: { id }, select: { updatedAt: true, responsible: true } });
  return {
    ...activity,
    lastChange: record
      ? { at: formatDateTime(record.updatedAt), by: record.responsible || "Portal Univelt" }
      : null,
  };
}

export async function companyMetrics(session: SessionUser) {
  const [machines, documents, activities, snapshots] = await Promise.all([
    prisma.machine.findMany({ where: companyFilter(session), include: { documents: true } }),
    prisma.document.findMany({ where: companyFilter(session) }),
    prisma.activity.findMany({ where: companyFilter(session), include: { attachments: true } }),
    prisma.complianceSnapshot.findMany({ where: companyFilter(session), orderBy: { createdAt: "asc" } }),
  ]);

  const highRisk = machines.filter((machine) => ["ALTO", "MUITO_ALTO", "EXTREMO", "INACEITAVEL"].includes(machine.riskLevel)).length;
  const statuses = documents.map((document) => computeDocumentStatus(document.expirationDate));
  const valid = statuses.filter((status) => status === "VALIDO").length;
  const expiring = statuses.filter((status) => status === "A_VENCER").length;
  const expired = statuses.filter((status) => status === "VENCIDO").length;
  const missingDocs = machines.filter((machine) => machine.documents.length === 0).length;
  const openActivities = activities.filter((activity) => activity.status !== "CONCLUIDA");
  const overdue = activities.filter((activity) => activity.status === "ATRASADA").length;
  const inProgress = activities.filter((activity) => activity.status === "EM_ANDAMENTO").length;
  const completed = activities.filter((activity) => activity.status === "CONCLUIDA").length;
  const onTime = activities.filter((activity) => activity.status !== "ATRASADA" && activity.status !== "ABERTA").length;
  const compliance = documents.length ? Math.round((valid / documents.length) * 100) : 0;

  const riskDistribution = [
    { label: "Desprezível", value: machines.filter((item) => item.riskLevel === "DESPREZIVEL").length, tone: "risk-negligible" },
    { label: "Muito baixo", value: machines.filter((item) => item.riskLevel === "MUITO_BAIXO").length, tone: "risk-very-low" },
    { label: "Baixo", value: machines.filter((item) => item.riskLevel === "BAIXO").length, tone: "risk-low" },
    { label: "Significante", value: machines.filter((item) => item.riskLevel === "SIGNIFICATIVO").length, tone: "risk-significant" },
    { label: "Alto", value: machines.filter((item) => item.riskLevel === "ALTO").length, tone: "risk-high" },
    { label: "Muito alto", value: machines.filter((item) => item.riskLevel === "MUITO_ALTO").length, tone: "risk-very-high" },
    { label: "Extremo", value: machines.filter((item) => item.riskLevel === "EXTREMO").length, tone: "risk-extreme" },
    { label: "Inaceitável", value: machines.filter((item) => item.riskLevel === "INACEITAVEL").length, tone: "risk-unacceptable" },
  ].map((item) => ({ ...item, percent: machines.length ? Math.round((item.value / machines.length) * 100) : 0 }));

  const sectors = [...new Set(machines.map((machine) => machine.sector))].map((name) => {
    const group = machines.filter((machine) => machine.sector === name);
    const attention = group.filter((machine) => ["ALTO", "MUITO_ALTO", "EXTREMO", "INACEITAVEL"].includes(machine.riskLevel) || machine.status === "INTERDITADA").length;
    const score = Math.max(40, 100 - attention * 8);
    return { name, machines: group.length, attention, score };
  });

  return {
    machineCount: machines.length,
    highRisk,
    expiring,
    expired,
    missingDocs,
    valid,
    compliance,
    openActivities: openActivities.length,
    overdue,
    inProgress,
    completed,
    onTimeRate: activities.length ? Math.round((onTime / activities.length) * 100) : 0,
    riskDistribution,
    snapshots,
    sectors,
    criticalDocuments: expired + missingDocs,
  };
}

export async function globalMetrics(session?: SessionUser) {
  const scopedCompany = session?.companyId ? { companyId: session.companyId } : {};
  const companyWhere = session?.companyId ? { id: session.companyId } : {};
  const [companies, machines, documents, activities, users] = await Promise.all([
    prisma.company.findMany({ where: companyWhere, include: { _count: { select: { units: true, users: true, machines: true } } } }),
    prisma.machine.findMany({ where: scopedCompany }),
    prisma.document.findMany({ where: scopedCompany }),
    prisma.activity.findMany({ where: scopedCompany }),
    prisma.user.findMany({ where: session?.companyId ? { companyId: session.companyId } : {} }),
  ]);
  const highRisk = machines.filter((machine) => ["ALTO", "MUITO_ALTO", "EXTREMO", "INACEITAVEL"].includes(machine.riskLevel)).length;
  const expired = documents.filter((document) => computeDocumentStatus(document.expirationDate) === "VENCIDO").length;
  const expiring = documents.filter((document) => computeDocumentStatus(document.expirationDate) === "A_VENCER").length;
  const valid = documents.filter((document) => computeDocumentStatus(document.expirationDate) === "VALIDO").length;
  return {
    companyCount: companies.length,
    unitCount: companies.reduce((sum, company) => sum + company._count.units, 0),
    machineCount: machines.length,
    highRisk,
    expired,
    expiring,
    pendingDocs: expired + expiring,
    compliance: documents.length ? Math.round((valid / documents.length) * 100) : 0,
    compliantMachines: machines.length - highRisk,
    criticalActions: activities.filter((activity) => activity.priority === "CRITICA" && activity.status !== "CONCLUIDA").length,
    activeUsers: users.filter((user) => user.status === "ACTIVE").length,
    adminUsers: users.filter((user) => user.role === "SUPER_ADMIN" || user.role === "CLIENT_ADMIN").length,
    invitedUsers: users.filter((user) => user.status === "INVITED").length,
  };
}
