import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canMutateOperations, getSession } from "@/lib/auth/session";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canMutateOperations(session)) return NextResponse.json({ error: "Sem permissão para excluir documentos." }, { status: 403 });
  const { id, attachmentId } = await params;
  const attachment = await prisma.actionPlanAttachment.findFirst({
    where: { id: attachmentId, actionPlanId: id, actionPlan: companyFilter(session) },
    include: { actionPlan: { select: { companyId: true, machineId: true, title: true } } },
  });
  if (!attachment) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (attachment.fileUrl) await deleteStoredFile(attachment.fileUrl);
  await prisma.$transaction([
    prisma.actionPlanAttachment.delete({ where: { id: attachment.id } }),
    prisma.auditLog.create({ data: { companyId: attachment.actionPlan.companyId, userId: session.id, action: "ACTION_PLAN_ATTACHMENT_DELETED", operation: "DELETE", entity: "ActionPlanAttachment", entityId: attachment.id, parentId: id, summary: `Documento ${attachment.name} removido do plano ${attachment.actionPlan.title}.` } }),
  ]);
  revalidatePath(`/cliente/maquinas/${attachment.actionPlan.machineId}`);
  return NextResponse.json({ ok: true });
}
