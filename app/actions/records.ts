"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActivityPriority, ActivityStatus, AuditOperation, DocumentKind, MachineStatus, RiskLevel, SafetyCategory, UserRole } from "@prisma/client";
import { requireAdmin, requireSession } from "@/lib/auth/guards";
import { canManageCompany, canMutateOperations, isSuperAdmin } from "@/lib/auth/session";
import { canManageChecklistTemplate } from "@/lib/checklist-permissions";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { assertAllowedActionPlanDocument, assertAllowedImage, assertAllowedUpload, deleteStoredFile, evidenceKindForFile, formatFileSize, getUploadedFile, getUploadedFiles, saveActionPlanAttachmentUpload, saveActivityEvidenceUpload, saveDocumentUpload, saveMachinePhotoUpload } from "@/lib/storage";
import { classifyHrnPair } from "@/lib/labels";
import { resolveMachineRisk } from "@/lib/machine-risk";

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function optional(form: FormData, key: string) {
  const value = text(form, key);
  return value.length ? value : null;
}

function numberValue(form: FormData, key: string) {
  const value = Number(text(form, key));
  return Number.isFinite(value) ? value : 0;
}

function dateValue(form: FormData, key: string) {
  const value = text(form, key);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function checked(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").toLowerCase();
  return value === "true" || value === "on" || value === "1";
}

function operationFromAction(action: string): AuditOperation {
  if (/DELETED|REMOVED/.test(action)) return "DELETE";
  if (/UPDATED|PROGRESS/.test(action)) return "UPDATE";
  return "CREATE";
}

async function writeAudit(
  companyId: string | null,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  summary: string,
  extra?: { operation?: AuditOperation; parentId?: string | null },
) {
  await prisma.auditLog.create({
    data: {
      companyId,
      userId,
      action,
      operation: extra?.operation ?? operationFromAction(action),
      entity,
      entityId,
      parentId: extra?.parentId ?? null,
      summary,
    },
  });
}

export async function createCompanyAction(formData: FormData) {
  const session = await requireAdmin();
  const company = await prisma.company.create({
    data: {
      name: text(formData, "name"),
      legalName: text(formData, "legalName"),
      cnpj: text(formData, "cnpj"),
      city: text(formData, "city"),
      manager: text(formData, "manager"),
      status: "ACTIVE",
      units: { create: { name: text(formData, "unitName") || "Matriz", city: text(formData, "city") } },
    },
  });
  await writeAudit(company.id, session.id, "COMPANY_CREATED", "Company", company.id, `Empresa ${company.name} cadastrada.`);
  revalidatePath("/admin/empresas");
  revalidatePath("/");
  redirect("/admin/empresas");
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageCompany(session)) throw new Error("Sem permissão para cadastrar usuários.");
  const role = text(formData, "role") as UserRole;
  const companyId = isSuperAdmin(session) ? optional(formData, "companyId") : session.companyId;
  if (role !== "SUPER_ADMIN" && !companyId) throw new Error("Usuário cliente precisa de uma empresa.");
  const user = await prisma.user.create({
    data: {
      name: text(formData, "name"),
      email: text(formData, "email").toLowerCase(),
      passwordHash: await hashPassword(text(formData, "password") || "Univelt@Temp2026"),
      role,
      companyId: role === "SUPER_ADMIN" ? null : companyId,
      unitId: optional(formData, "unitId"),
      status: "ACTIVE",
    },
  });
  await writeAudit(user.companyId, session.id, "USER_CREATED", "User", user.id, `Usuário ${user.email} cadastrado.`);
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function createMachineAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageCompany(session)) throw new Error("Somente administradores cadastram máquinas.");
  const companyId = isSuperAdmin(session) ? text(formData, "companyId") : session.companyId;
  if (!companyId) throw new Error("Empresa obrigatória.");
  const unitId = text(formData, "unitId");
  const unit = await prisma.unit.findFirst({ where: { id: unitId, companyId } });
  if (!unit) throw new Error("Unidade inválida para a empresa.");
  const machine = await prisma.machine.create({
    data: {
      companyId,
      unitId,
      ...machineFields(formData),
    },
  });
  await writeAudit(companyId, session.id, "MACHINE_CREATED", "Machine", machine.id, `Máquina ${machine.code} cadastrada.`);
  revalidatePath("/cliente/maquinas");
  revalidatePath("/admin/maquinas");
  redirect(`/cliente/maquinas/${machine.id}`);
}

function machineFields(formData: FormData) {
  const name = text(formData, "name");
  const hrnCurrent = text(formData, "hrnCurrent");
  const hrnResidual = optional(formData, "hrnResidual");
  const riskOrigin = text(formData, "riskOrigin") === "MANUAL" ? "MANUAL" as const : "AUTOMATIC" as const;
  const resolvedRisk = resolveMachineRisk({ origin: riskOrigin, manualRiskLevel: optional(formData, "manualRiskLevel") as RiskLevel | null, hrnCurrent, hrnResidual });
  return {
    code: text(formData, "code"),
    name,
    tag: text(formData, "tag"),
    serial: text(formData, "serial"),
    assetTag: optional(formData, "assetTag") ?? text(formData, "tag"),
    machineType: optional(formData, "machineType"),
    manufacturer: text(formData, "manufacturer"),
    model: text(formData, "model"),
    year: text(formData, "year"),
    sector: text(formData, "sector"),
    area: text(formData, "area") || "Geral",
    capacity: optional(formData, "capacity"),
    category: (optional(formData, "category") as SafetyCategory | null) ?? null,
    hrnCurrent,
    hrnResidual,
    ...resolvedRisk,
    energySources: text(formData, "energySources") || "Elétrica",
    mainSystems: optional(formData, "mainSystems"),
    usage: optional(formData, "usage"),
    processCharacteristics: optional(formData, "processCharacteristics"),
    operatorCount: numberValue(formData, "operatorCount") || null,
    operatorSkills: optional(formData, "operatorSkills"),
    mechMaintenanceCount: numberValue(formData, "mechMaintenanceCount") || null,
    mechMaintenanceSkills: optional(formData, "mechMaintenanceSkills"),
    elecMaintenanceCount: numberValue(formData, "elecMaintenanceCount") || null,
    elecMaintenanceSkills: optional(formData, "elecMaintenanceSkills"),
    observations: optional(formData, "observations"),
    documentNumber: optional(formData, "documentNumber"),
    documentRevision: optional(formData, "documentRevision"),
    status: (text(formData, "status") || "OPERACIONAL") as MachineStatus,
    description: text(formData, "description") || name,
  };
}

export async function updateMachineAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageCompany(session)) throw new Error("Sem permissão para editar máquinas.");
  const machineId = text(formData, "machineId");
  const machine = await prisma.machine.findFirst({
    where: { id: machineId, ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) },
    select: { id: true, companyId: true },
  });
  if (!machine) throw new Error("Máquina não encontrada.");
  const unitId = text(formData, "unitId");
  const unit = await prisma.unit.findFirst({ where: { id: unitId, companyId: machine.companyId }, select: { id: true } });
  if (!unit) throw new Error("Unidade inválida para a empresa da máquina.");

  const updated = await prisma.machine.update({ where: { id: machine.id }, data: { ...machineFields(formData), unitId } });
  await writeAudit(machine.companyId, session.id, "MACHINE_UPDATED", "Machine", machine.id, `Dados da máquina ${updated.code} atualizados.`);
  revalidatePath("/cliente/maquinas");
  revalidatePath("/admin/maquinas");
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect(`/cliente/maquinas/${machine.id}`);
}

export async function deleteMachineAction(formData: FormData) {
  const session = await requireSession();
  if (!canManageCompany(session)) throw new Error("Sem permissão para excluir máquinas.");
  const machine = await prisma.machine.findFirst({
    where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) },
    include: {
      photos: { select: { url: true } },
      documents: { select: { fileUrl: true } },
      riskAssessments: { select: { fileUrl: true } },
      activities: { include: { attachments: { select: { url: true } } } },
    },
  });
  if (!machine) throw new Error("Máquina não encontrada.");

  const storedFiles = [
    ...machine.photos.map((photo) => photo.url),
    ...machine.documents.map((document) => document.fileUrl),
    ...machine.riskAssessments.map((assessment) => assessment.fileUrl),
    ...machine.activities.flatMap((activity) => activity.attachments.map((attachment) => attachment.url)),
  ].filter((file): file is string => Boolean(file));

  await prisma.$transaction(async (transaction) => {
    await transaction.machine.delete({ where: { id: machine.id } });
    await transaction.auditLog.create({
      data: {
        companyId: machine.companyId,
        userId: session.id,
        action: "MACHINE_DELETED",
        operation: "DELETE",
        entity: "Machine",
        entityId: machine.id,
        summary: `Máquina ${machine.code} e seus registros vinculados foram excluídos.`,
      },
    });
  });

  await Promise.all(storedFiles.map((file) => deleteStoredFile(file)));
  revalidatePath("/cliente/maquinas");
  revalidatePath("/admin/maquinas");
  revalidatePath("/");
  redirect(isSuperAdmin(session) ? "/admin/maquinas" : "/cliente/maquinas");
}

export async function uploadMachinePhotoAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({
    where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) },
  });
  if (!machine) throw new Error("Máquina não encontrada.");
  const file = getUploadedFile(formData, "file");
  if (!file) throw new Error("Selecione uma foto.");
  assertAllowedImage(file);
  const caption = text(formData, "caption");
  if (!caption) throw new Error("Informe o nome da foto.");
  const photo = await prisma.machinePhoto.create({
    data: {
      machineId: machine.id,
      kind: "OTHER",
      caption,
      takenAt: dateValue(formData, "takenAt"),
      compliant: checked(formData, "compliant"),
    },
  });
  const saved = await saveMachinePhotoUpload(file, machine.companyId, machine.id, photo.id);
  await prisma.machinePhoto.update({
    where: { id: photo.id },
    data: { url: saved.relativePath },
  });
  await writeAudit(machine.companyId, session.id, "MACHINE_PHOTO_UPLOADED", "MachinePhoto", photo.id, `Foto "${caption}" enviada para ${machine.code}.`, { parentId: machine.id });
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  revalidatePath("/cliente/maquinas");
}

export async function deleteMachinePhotoAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machineId = text(formData, "machineId");
  const photo = await prisma.machinePhoto.findFirst({
    where: {
      id: text(formData, "photoId"),
      machineId,
      machine: isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" },
    },
    include: { machine: { select: { companyId: true, code: true } } },
  });
  if (!photo) throw new Error("Foto não encontrada.");
  if (photo.url) await deleteStoredFile(photo.url);
  await prisma.machinePhoto.delete({ where: { id: photo.id } });
  await writeAudit(photo.machine.companyId, session.id, "MACHINE_PHOTO_DELETED", "MachinePhoto", photo.id, `Foto "${photo.caption}" removida de ${photo.machine.code}.`, { parentId: machineId });
  revalidatePath(`/cliente/maquinas/${machineId}`);
  revalidatePath("/cliente/maquinas");
}

export async function createDocumentAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const file = getUploadedFile(formData, "file");
  if (file) assertAllowedUpload(file);
  const expiration = optional(formData, "expirationDate");
  const document = await prisma.document.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      name: text(formData, "name"),
      type: (text(formData, "type") || "OUTRO") as DocumentKind,
      version: text(formData, "version") || "1.0",
      issueDate: new Date(text(formData, "issueDate") || Date.now()),
      expirationDate: expiration ? new Date(expiration) : null,
      responsible: text(formData, "responsible") || session.name,
      description: text(formData, "description") || "Documento vinculado à máquina.",
    },
  });
  if (file) {
    const saved = await saveDocumentUpload(file, machine.companyId, document.id);
    await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl: saved.relativePath, format: saved.format, size: saved.size },
    });
  }
  await writeAudit(machine.companyId, session.id, "DOCUMENT_CREATED", "Document", document.id, `Documento ${document.name} vinculado a ${machine.code}.`, { parentId: machine.id });
  revalidatePath("/cliente/documentos");
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect("/cliente/documentos");
}

export async function createActivityAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const title = text(formData, "title").trim();
  const responsible = text(formData, "responsible").trim();
  const description = text(formData, "description").trim();
  const dueDateValue = text(formData, "dueDate");
  if (!title || !responsible || !description || !dueDateValue) {
    throw new Error("Preencha máquina, título, responsável, data prevista e descrição.");
  }
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) throw new Error("Data prevista inválida.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const activity = await prisma.activity.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      title,
      type: text(formData, "type") || "Ação corretiva",
      description,
      responsible,
      responsibleEmail: optional(formData, "responsibleEmail"),
      dueDate,
      executedAt: optional(formData, "executedAt") ? new Date(text(formData, "executedAt")) : null,
      status: (text(formData, "status") || "ABERTA") as ActivityStatus,
      priority: (text(formData, "priority") || "MEDIA") as ActivityPriority,
      progress: Math.min(100, Math.max(0, Math.round(numberValue(formData, "progress")))),
    },
  });
  await saveActivityFiles(activity.id, machine.companyId, formData);
  await writeAudit(machine.companyId, session.id, "ACTIVITY_CREATED", "Activity", activity.id, `Atividade ${activity.title} criada para ${machine.code}.`, { parentId: machine.id });
  revalidatePath("/cliente/atividades");
  redirect(`/cliente/atividades/${activity.id}`);
}

async function saveActivityFiles(activityId: string, companyId: string, formData: FormData) {
  const files = getUploadedFiles(formData, "file");
  for (const file of files) {
    assertAllowedUpload(file);
    const attachment = await prisma.activityAttachment.create({
      data: { activityId, name: file.name || "Evidência", kind: evidenceKindForFile(file) },
    });
    const saved = await saveActivityEvidenceUpload(file, companyId, activityId, attachment.id);
    await prisma.activityAttachment.update({
      where: { id: attachment.id },
      data: { url: saved.relativePath, name: saved.fileName },
    });
  }
  return files.length;
}

function progressStatus(progress: number, dueDate: Date): ActivityStatus {
  if (progress >= 100) return "CONCLUIDA";
  if (dueDate.getTime() < Date.now()) return "ATRASADA";
  return progress > 0 ? "EM_ANDAMENTO" : "ABERTA";
}

export async function updateActivityProgressAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const activity = await prisma.activity.findFirst({
    where: { id: text(formData, "activityId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) },
  });
  if (!activity) throw new Error("Atividade não encontrada.");
  const progress = Math.min(100, Math.max(0, Math.round(numberValue(formData, "progress"))));
  const status = progressStatus(progress, activity.dueDate);
  await prisma.activity.update({
    where: { id: activity.id },
    data: {
      progress,
      status,
      executedAt: progress >= 100 ? activity.executedAt ?? new Date() : null,
    },
  });
  await writeAudit(activity.companyId, session.id, "ACTIVITY_PROGRESS_UPDATED", "Activity", activity.id, `Progresso de ${activity.title} atualizado para ${progress}%.`);
  revalidatePath("/cliente/atividades");
  revalidatePath(`/cliente/atividades/${activity.id}`);
}

export async function uploadActivityEvidenceAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const activity = await prisma.activity.findFirst({
    where: { id: text(formData, "activityId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) },
  });
  if (!activity) throw new Error("Atividade não encontrada.");
  const count = await saveActivityFiles(activity.id, activity.companyId, formData);
  if (!count) throw new Error("Selecione um arquivo.");
  await writeAudit(activity.companyId, session.id, "ACTIVITY_EVIDENCE_UPLOADED", "Activity", activity.id, `${count} evidência(s) anexada(s) a ${activity.title}.`);
  revalidatePath("/cliente/atividades");
  revalidatePath(`/cliente/atividades/${activity.id}`);
}

export async function deleteActivityEvidenceAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const activityId = text(formData, "activityId");
  const attachment = await prisma.activityAttachment.findFirst({
    where: {
      id: text(formData, "attachmentId"),
      activityId,
      activity: isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" },
    },
    include: { activity: { select: { companyId: true, title: true } } },
  });
  if (!attachment) throw new Error("Evidência não encontrada.");
  if (attachment.url) await deleteStoredFile(attachment.url);
  await prisma.activityAttachment.delete({ where: { id: attachment.id } });
  await writeAudit(attachment.activity.companyId, session.id, "ACTIVITY_EVIDENCE_DELETED", "ActivityAttachment", attachment.id, `Evidência removida de ${attachment.activity.title}.`);
  revalidatePath("/cliente/atividades");
  revalidatePath(`/cliente/atividades/${activityId}`);
}

export async function createRiskAssessmentAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const hrnCurrent = text(formData, "hrnCurrent");
  const hrnResidual = optional(formData, "hrnResidual");
  const assessment = await prisma.riskAssessment.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      documentNumber: text(formData, "documentNumber"),
      revision: text(formData, "revision") || "1.0",
      category: (text(formData, "category") || "CAT_1") as SafetyCategory,
      hrnCurrent: numberValue(formData, "hrnCurrent"),
      hrnResidual: numberValue(formData, "hrnResidual"),
      riskLevel: classifyHrnPair(hrnCurrent, hrnResidual) ?? "BAIXO",
      issuedAt: new Date(text(formData, "issuedAt") || Date.now()),
      expiresAt: optional(formData, "expiresAt") ? new Date(text(formData, "expiresAt")) : null,
      notes: optional(formData, "notes"),
    },
  });
  await prisma.machine.update({
    where: { id: machine.id },
    data: {
      documentNumber: assessment.documentNumber,
      documentRevision: assessment.revision,
      category: assessment.category,
      hrnCurrent: String(assessment.hrnCurrent),
      hrnResidual: String(assessment.hrnResidual),
      riskLevel: machine.riskOrigin === "MANUAL" ? machine.riskLevel : assessment.riskLevel,
    },
  });
  await writeAudit(machine.companyId, session.id, "APR_CREATED", "RiskAssessment", assessment.id, `APR ${assessment.documentNumber} cadastrada.`, { parentId: machine.id });
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect(`/cliente/maquinas/${machine.id}`);
}

export async function createChecklistTemplateAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const descriptions = formData.getAll("itemDescription").map((value) => String(value).trim()).filter(Boolean);
  if (!descriptions.length) throw new Error("Inclua pelo menos um item no checklist.");
  const companyId = isSuperAdmin(session)
    ? optional(formData, "companyId")
    : session.companyId;
  const template = await prisma.checklistTemplate.create({
    data: {
      companyId,
      name: text(formData, "name"),
      description: optional(formData, "description"),
      items: {
        create: descriptions.map((description, index) => ({ number: index + 1, description })),
      },
    },
  });
  await writeAudit(companyId, session.id, "CHECKLIST_TEMPLATE_CREATED", "ChecklistTemplate", template.id, `Checklist ${template.name} cadastrado com ${descriptions.length} itens.`);
  revalidatePath("/cliente/checklists");
  redirect(`/cliente/checklists/${template.id}`);
}

export async function addChecklistItemAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const templateId = text(formData, "templateId");
  const description = text(formData, "description");
  if (!description) throw new Error("Informe a descrição do item.");
  const template = await prisma.checklistTemplate.findFirst({
    where: {
      id: templateId,
      isActive: true,
      ...(isSuperAdmin(session) ? {} : { OR: [{ companyId: session.companyId }, { companyId: null }] }),
    },
    include: { items: true },
  });
  if (!template) throw new Error("Checklist não encontrado.");
  assertChecklistOwnership(session, template.companyId);
  const nextNumber = template.items.reduce((max, item) => Math.max(max, item.number), 0) + 1;
  const [item] = await prisma.$transaction([
    prisma.checklistTemplateItem.create({
      data: { templateId: template.id, number: nextNumber, description },
    }),
    prisma.checklistTemplate.update({
      where: { id: template.id },
      data: { updatedAt: new Date() },
    }),
  ]);
  await writeAudit(template.companyId, session.id, "CHECKLIST_ITEM_ADDED", "ChecklistTemplateItem", item.id, `Item ${nextNumber} incluído em ${template.name}.`, { parentId: template.id });
  revalidatePath(`/cliente/checklists/${template.id}`);
  revalidatePath("/cliente/checklists");
}

export type ChecklistMutationState = { ok: boolean; message: string };

function mutationError(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a alteração.";
}

function assertChecklistOwnership(session: Awaited<ReturnType<typeof requireSession>>, companyId: string | null) {
  if (!canManageChecklistTemplate(session, companyId)) {
    if (!companyId && !isSuperAdmin(session)) throw new Error("Somente a Univelt pode alterar um modelo global.");
    throw new Error("Sem permissão para alterar checklists.");
  }
}

export async function updateChecklistTemplateAction(_state: ChecklistMutationState, formData: FormData): Promise<ChecklistMutationState> {
  try {
    const session = await requireSession();
    const template = await prisma.checklistTemplate.findUnique({ where: { id: text(formData, "templateId") } });
    if (!template) throw new Error("Checklist não encontrado.");
    assertChecklistOwnership(session, template.companyId);
    const name = text(formData, "name");
    if (!name) throw new Error("Informe o nome do checklist.");
    await prisma.checklistTemplate.update({ where: { id: template.id }, data: { name, description: optional(formData, "description") } });
    await writeAudit(template.companyId, session.id, "CHECKLIST_TEMPLATE_UPDATED", "ChecklistTemplate", template.id, `Checklist ${name} atualizado.`, { operation: "UPDATE" });
    revalidatePath("/cliente/checklists");
    revalidatePath(`/cliente/checklists/${template.id}`);
    return { ok: true, message: "Checklist atualizado com sucesso." };
  } catch (error) {
    return { ok: false, message: mutationError(error) };
  }
}

export async function setChecklistTemplateActiveAction(_state: ChecklistMutationState, formData: FormData): Promise<ChecklistMutationState> {
  try {
    const session = await requireSession();
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: text(formData, "templateId") },
      include: { _count: { select: { executions: true } }, items: { select: { _count: { select: { answers: true } } } } },
    });
    if (!template) throw new Error("Checklist não encontrado.");
    assertChecklistOwnership(session, template.companyId);
    const restore = text(formData, "intent") === "restore";
    if (restore) {
      await prisma.checklistTemplate.update({ where: { id: template.id }, data: { isActive: true, archivedAt: null } });
      await writeAudit(template.companyId, session.id, "CHECKLIST_TEMPLATE_RESTORED", "ChecklistTemplate", template.id, `Checklist ${template.name} reativado.`, { operation: "UPDATE" });
      revalidatePath("/cliente/checklists");
      revalidatePath(`/cliente/checklists/${template.id}`);
      return { ok: true, message: "Checklist reativado." };
    }

    const historyCount = await prisma.auditLog.count({
      where: { entity: "ChecklistTemplate", entityId: template.id, action: { notIn: ["CHECKLIST_TEMPLATE_CREATED"] } },
    });
    const hasOperationalHistory = template._count.executions > 0 || template.items.some((item) => item._count.answers > 0) || historyCount > 0;
    if (hasOperationalHistory) {
      await prisma.checklistTemplate.update({ where: { id: template.id }, data: { isActive: false, archivedAt: new Date() } });
      await writeAudit(template.companyId, session.id, "CHECKLIST_TEMPLATE_ARCHIVED", "ChecklistTemplate", template.id, `Checklist ${template.name} desativado com o histórico preservado.`, { operation: "UPDATE" });
      revalidatePath("/cliente/checklists");
      revalidatePath(`/cliente/checklists/${template.id}`);
      return { ok: true, message: "Checklist desativado. Os preenchimentos históricos foram preservados." };
    }

    await prisma.checklistTemplate.delete({ where: { id: template.id } });
    await writeAudit(template.companyId, session.id, "CHECKLIST_TEMPLATE_DELETED", "ChecklistTemplate", template.id, `Checklist ${template.name} excluído sem registros vinculados.`, { operation: "DELETE" });
    revalidatePath("/cliente/checklists");
    return { ok: true, message: "Checklist sem histórico excluído." };
  } catch (error) {
    return { ok: false, message: mutationError(error) };
  }
}

export async function updateChecklistItemAction(_state: ChecklistMutationState, formData: FormData): Promise<ChecklistMutationState> {
  try {
    const session = await requireSession();
    const item = await prisma.checklistTemplateItem.findUnique({ where: { id: text(formData, "itemId") }, include: { template: true } });
    if (!item) throw new Error("Item não encontrado.");
    assertChecklistOwnership(session, item.template.companyId);
    const description = text(formData, "description");
    if (!description) throw new Error("Informe a descrição do item.");
    await prisma.checklistTemplateItem.update({ where: { id: item.id }, data: { description } });
    await prisma.checklistTemplate.update({ where: { id: item.templateId }, data: { updatedAt: new Date() } });
    await writeAudit(item.template.companyId, session.id, "CHECKLIST_ITEM_UPDATED", "ChecklistTemplateItem", item.id, `Item ${item.number} de ${item.template.name} atualizado.`, { operation: "UPDATE", parentId: item.templateId });
    revalidatePath(`/cliente/checklists/${item.templateId}`);
    return { ok: true, message: "Item atualizado." };
  } catch (error) {
    return { ok: false, message: mutationError(error) };
  }
}

export async function setChecklistItemActiveAction(_state: ChecklistMutationState, formData: FormData): Promise<ChecklistMutationState> {
  try {
    const session = await requireSession();
    const item = await prisma.checklistTemplateItem.findUnique({
      where: { id: text(formData, "itemId") },
      include: { template: true, _count: { select: { answers: true } } },
    });
    if (!item) throw new Error("Item não encontrado.");
    assertChecklistOwnership(session, item.template.companyId);
    const restore = text(formData, "intent") === "restore";
    if (restore) {
      await prisma.checklistTemplateItem.update({ where: { id: item.id }, data: { isActive: true, archivedAt: null } });
      await writeAudit(item.template.companyId, session.id, "CHECKLIST_ITEM_RESTORED", "ChecklistTemplateItem", item.id, `Item ${item.number} reativado em ${item.template.name}.`, { operation: "UPDATE", parentId: item.templateId });
      revalidatePath(`/cliente/checklists/${item.templateId}`);
      return { ok: true, message: "Item reativado." };
    }
    const historyCount = await prisma.auditLog.count({
      where: { entity: "ChecklistTemplateItem", entityId: item.id, action: { notIn: ["CHECKLIST_ITEM_ADDED"] } },
    });
    if (item._count.answers > 0 || historyCount > 0) {
      await prisma.checklistTemplateItem.update({ where: { id: item.id }, data: { isActive: false, archivedAt: new Date() } });
      await writeAudit(item.template.companyId, session.id, "CHECKLIST_ITEM_ARCHIVED", "ChecklistTemplateItem", item.id, `Item ${item.number} desativado em ${item.template.name}; respostas anteriores preservadas.`, { operation: "UPDATE", parentId: item.templateId });
      revalidatePath(`/cliente/checklists/${item.templateId}`);
      return { ok: true, message: "Item desativado. As respostas anteriores foram preservadas." };
    }
    await prisma.checklistTemplateItem.delete({ where: { id: item.id } });
    await writeAudit(item.template.companyId, session.id, "CHECKLIST_ITEM_DELETED", "ChecklistTemplateItem", item.id, `Item ${item.number} excluído de ${item.template.name}.`, { operation: "DELETE", parentId: item.templateId });
    revalidatePath(`/cliente/checklists/${item.templateId}`);
    return { ok: true, message: "Item sem histórico excluído." };
  } catch (error) {
    return { ok: false, message: mutationError(error) };
  }
}

export async function createChecklistAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const template = await prisma.checklistTemplate.findFirst({
    where: {
      id: text(formData, "templateId"),
      isActive: true,
      ...(isSuperAdmin(session) ? {} : { OR: [{ companyId: machine.companyId }, { companyId: null }] }),
    },
    include: { items: { where: { isActive: true }, orderBy: { number: "asc" } } },
  });
  if (!template) throw new Error("Modelo de checklist não encontrado.");
  if (!template.items.length) throw new Error("Este checklist ainda não tem itens cadastrados.");
  const execution = await prisma.checklistExecution.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      templateId: template.id,
      executedBy: session.name,
      notes: optional(formData, "notes"),
      answers: {
        create: template.items.map((item) => ({
          itemId: item.id,
          result: (text(formData, `item-${item.id}`) || "NA") as "SIM" | "NAO" | "PARCIAL" | "NA",
        })),
      },
    },
  });
  await writeAudit(machine.companyId, session.id, "CHECKLIST_CREATED", "ChecklistExecution", execution.id, `Checklist ${template.name} preenchido para ${machine.code} por ${session.name}.`, { parentId: machine.id });
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect(`/cliente/maquinas/${machine.id}`);
}

export async function createActionPlanAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const checklistExecutionId = optional(formData, "checklistExecutionId");
  if (checklistExecutionId) {
    const execution = await prisma.checklistExecution.findFirst({ where: { id: checklistExecutionId, machineId: machine.id, companyId: machine.companyId }, select: { id: true } });
    if (!execution) throw new Error("O preenchimento de checklist selecionado não pertence a esta máquina.");
  }
  const files = getUploadedFiles(formData, "attachments");
  files.forEach(assertAllowedActionPlanDocument);
  const plan = await prisma.actionPlan.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      checklistExecutionId,
      title: text(formData, "title") || `Plano de ação ${machine.code}`,
      items: {
        create: [
          {
            sequence: 1,
            location: text(formData, "location") || "Geral",
            nonconformity: text(formData, "nonconformity"),
            action: text(formData, "action"),
            reference: optional(formData, "reference"),
            responsible: text(formData, "responsible") || session.name,
            status: "ABERTA",
          },
        ],
      },
    },
  });
  const storedFiles: string[] = [];
  try {
    for (const file of files) {
      const format = assertAllowedActionPlanDocument(file);
      const attachment = await prisma.actionPlanAttachment.create({ data: { actionPlanId: plan.id, name: file.name, format, size: formatFileSize(file.size), sizeBytes: file.size, uploadedBy: session.name } });
      const saved = await saveActionPlanAttachmentUpload(file, machine.companyId, plan.id, attachment.id);
      storedFiles.push(saved.relativePath);
      const updated = await prisma.actionPlanAttachment.update({ where: { id: attachment.id }, data: { name: saved.fileName, format: saved.format, size: saved.size, fileUrl: saved.relativePath } });
      await writeAudit(machine.companyId, session.id, "ACTION_PLAN_ATTACHMENT_ADDED", "ActionPlanAttachment", updated.id, `Documento ${updated.name} anexado ao plano ${plan.title}.`, { parentId: plan.id });
    }
  } catch (error) {
    await Promise.all(storedFiles.map((file) => deleteStoredFile(file)));
    await prisma.actionPlan.delete({ where: { id: plan.id } });
    throw error;
  }
  await writeAudit(machine.companyId, session.id, "ACTION_PLAN_CREATED", "ActionPlan", plan.id, `Plano de ação criado para ${machine.code}${files.length ? ` com ${files.length} documento(s)` : ""}.`, { parentId: machine.id });
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect(`/cliente/maquinas/${machine.id}#action-plan-${plan.id}`);
}
