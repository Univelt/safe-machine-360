import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canMutateOperations, getSession } from "@/lib/auth/session";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";
import { assertAllowedActionPlanDocument, deleteStoredFile, formatFileSize, saveActionPlanAttachmentUpload } from "@/lib/storage";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canMutateOperations(session)) return NextResponse.json({ error: "Sem permissão para anexar documentos." }, { status: 403 });
  const { id } = await params;
  const plan = await prisma.actionPlan.findFirst({ where: { id, ...companyFilter(session) }, select: { id: true, title: true, companyId: true, machineId: true } });
  if (!plan) return NextResponse.json({ error: "Plano de ação não encontrado." }, { status: 404 });

  try {
    const formData = await request.formData();
    const value = formData.get("file");
    if (!value || typeof value === "string") throw new Error("Selecione um arquivo.");
    const file = value as File;
    const format = assertAllowedActionPlanDocument(file);
    const attachment = await prisma.actionPlanAttachment.create({
      data: { actionPlanId: plan.id, name: file.name, format, size: formatFileSize(file.size), sizeBytes: file.size, uploadedBy: session.name },
    });
    try {
      const saved = await saveActionPlanAttachmentUpload(file, plan.companyId, plan.id, attachment.id);
      let updated;
      try {
        [updated] = await prisma.$transaction([
          prisma.actionPlanAttachment.update({ where: { id: attachment.id }, data: { name: saved.fileName, format: saved.format, size: saved.size, fileUrl: saved.relativePath } }),
          prisma.auditLog.create({ data: { companyId: plan.companyId, userId: session.id, action: "ACTION_PLAN_ATTACHMENT_ADDED", operation: "CREATE", entity: "ActionPlanAttachment", entityId: attachment.id, parentId: plan.id, summary: `Documento ${saved.fileName} anexado ao plano ${plan.title}.` } }),
        ]);
      } catch (error) {
        await deleteStoredFile(saved.relativePath);
        throw error;
      }
      revalidatePath(`/cliente/maquinas/${plan.machineId}`);
      return NextResponse.json({ attachment: { id: updated.id, name: updated.name, format: updated.format, size: updated.size, uploadedBy: updated.uploadedBy, createdAt: updated.createdAt.toISOString(), url: `/api/action-plans/${plan.id}/attachments/${updated.id}/file` } }, { status: 201 });
    } catch (error) {
      await prisma.actionPlanAttachment.delete({ where: { id: attachment.id } }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível enviar o documento." }, { status: 400 });
  }
}
