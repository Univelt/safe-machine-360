"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActivityPriority, ActivityStatus, DocumentKind, MachineStatus, RiskLevel, SafetyCategory, UserRole } from "@prisma/client";
import { requireAdmin, requireSession } from "@/lib/auth/guards";
import { canManageCompany, canMutateOperations, isSuperAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { assertAllowedImage, assertAllowedUpload, deleteStoredFile, evidenceKindForFile, getUploadedFile, getUploadedFiles, saveActivityEvidenceUpload, saveDocumentUpload, saveMachinePhotoUpload } from "@/lib/storage";

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

async function writeAudit(companyId: string | null, userId: string, action: string, entity: string, entityId: string, summary: string) {
  await prisma.auditLog.create({ data: { companyId, userId, action, entity, entityId, summary } });
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
      code: text(formData, "code"),
      name: text(formData, "name"),
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
      hrnCurrent: text(formData, "hrnCurrent"),
      hrnResidual: optional(formData, "hrnResidual"),
      riskLevel: (text(formData, "riskLevel") || "SIGNIFICATIVO") as RiskLevel,
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
      equipmentLimits: optional(formData, "equipmentLimits"),
      observations: optional(formData, "observations"),
      documentNumber: optional(formData, "documentNumber"),
      documentRevision: optional(formData, "documentRevision"),
      status: (text(formData, "status") || "OPERACIONAL") as MachineStatus,
      description: text(formData, "description") || text(formData, "name"),
    },
  });
  await writeAudit(companyId, session.id, "MACHINE_CREATED", "Machine", machine.id, `Máquina ${machine.code} cadastrada.`);
  revalidatePath("/cliente/maquinas");
  revalidatePath("/admin/maquinas");
  redirect(`/cliente/maquinas/${machine.id}`);
}

export async function uploadMachinePhotoAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({
    where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) },
  });
  if (!machine) throw new Error("Máquina não encontrada.");
  const files = getUploadedFiles(formData, "file");
  if (!files.length) throw new Error("Selecione uma foto.");

  for (const file of files) {
    assertAllowedImage(file);
    const photo = await prisma.machinePhoto.create({
      data: { machineId: machine.id, kind: "OTHER", caption: file.name || "Foto do equipamento" },
    });
    const saved = await saveMachinePhotoUpload(file, machine.companyId, machine.id, photo.id);
    await prisma.machinePhoto.update({
      where: { id: photo.id },
      data: { url: saved.relativePath, caption: file.name || photo.caption },
    });
  }
  await writeAudit(machine.companyId, session.id, "MACHINE_PHOTO_UPLOADED", "Machine", machine.id, `${files.length} foto(s) enviada(s) para ${machine.code}.`);
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
  await writeAudit(photo.machine.companyId, session.id, "MACHINE_PHOTO_DELETED", "MachinePhoto", photo.id, `Foto removida de ${photo.machine.code}.`);
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
  await writeAudit(machine.companyId, session.id, "DOCUMENT_CREATED", "Document", document.id, `Documento ${document.name} vinculado a ${machine.code}.`);
  revalidatePath("/cliente/documentos");
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect("/cliente/documentos");
}

export async function createActivityAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const activity = await prisma.activity.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      title: text(formData, "title"),
      type: text(formData, "type") || "Ação corretiva",
      description: text(formData, "description"),
      responsible: text(formData, "responsible"),
      responsibleEmail: optional(formData, "responsibleEmail"),
      dueDate: new Date(text(formData, "dueDate") || Date.now()),
      executedAt: optional(formData, "executedAt") ? new Date(text(formData, "executedAt")) : null,
      status: (text(formData, "status") || "ABERTA") as ActivityStatus,
      priority: (text(formData, "priority") || "MEDIA") as ActivityPriority,
      progress: Math.min(100, Math.max(0, Math.round(numberValue(formData, "progress")))),
    },
  });
  await saveActivityFiles(activity.id, machine.companyId, formData);
  await writeAudit(machine.companyId, session.id, "ACTIVITY_CREATED", "Activity", activity.id, `Atividade ${activity.title} criada para ${machine.code}.`);
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
  const assessment = await prisma.riskAssessment.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
      documentNumber: text(formData, "documentNumber"),
      revision: text(formData, "revision") || "1.0",
      category: (text(formData, "category") || "CAT_1") as SafetyCategory,
      hrnCurrent: numberValue(formData, "hrnCurrent"),
      hrnResidual: numberValue(formData, "hrnResidual"),
      riskLevel: (text(formData, "riskLevel") || "SIGNIFICATIVO") as RiskLevel,
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
      riskLevel: assessment.riskLevel,
    },
  });
  await writeAudit(machine.companyId, session.id, "APR_CREATED", "RiskAssessment", assessment.id, `APR ${assessment.documentNumber} cadastrada.`);
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
      ...(isSuperAdmin(session) ? {} : { OR: [{ companyId: session.companyId }, { companyId: null }] }),
    },
    include: { items: true },
  });
  if (!template) throw new Error("Checklist não encontrado.");
  if (template.companyId && !isSuperAdmin(session) && template.companyId !== session.companyId) {
    throw new Error("Sem permissão.");
  }
  const nextNumber = template.items.reduce((max, item) => Math.max(max, item.number), 0) + 1;
  await prisma.$transaction([
    prisma.checklistTemplateItem.create({
      data: { templateId: template.id, number: nextNumber, description },
    }),
    prisma.checklistTemplate.update({
      where: { id: template.id },
      data: { updatedAt: new Date() },
    }),
  ]);
  await writeAudit(template.companyId, session.id, "CHECKLIST_ITEM_ADDED", "ChecklistTemplateItem", template.id, `Item ${nextNumber} incluído em ${template.name}.`);
  revalidatePath(`/cliente/checklists/${template.id}`);
  revalidatePath("/cliente/checklists");
}

export async function createChecklistAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const template = await prisma.checklistTemplate.findFirst({
    where: {
      id: text(formData, "templateId"),
      ...(isSuperAdmin(session) ? {} : { OR: [{ companyId: machine.companyId }, { companyId: null }] }),
    },
    include: { items: { orderBy: { number: "asc" } } },
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
  await prisma.auditLog.create({
    data: {
      companyId: machine.companyId,
      userId: session.id,
      action: "CHECKLIST_CREATED",
      entity: "ChecklistExecution",
      entityId: execution.id,
      summary: `Checklist ${template.name} preenchido para ${machine.code} por ${session.name}.`,
    },
  });
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect(`/cliente/maquinas/${machine.id}`);
}

export async function createActionPlanAction(formData: FormData) {
  const session = await requireSession();
  if (!canMutateOperations(session)) throw new Error("Sem permissão.");
  const machine = await prisma.machine.findFirst({ where: { id: text(formData, "machineId"), ...(isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" }) } });
  if (!machine) throw new Error("Máquina não encontrada.");
  const plan = await prisma.actionPlan.create({
    data: {
      companyId: machine.companyId,
      machineId: machine.id,
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
  await writeAudit(machine.companyId, session.id, "ACTION_PLAN_CREATED", "ActionPlan", plan.id, `Plano de ação criado para ${machine.code}.`);
  revalidatePath(`/cliente/maquinas/${machine.id}`);
  redirect(`/cliente/maquinas/${machine.id}`);
}
