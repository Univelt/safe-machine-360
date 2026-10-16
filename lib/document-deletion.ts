import type { Prisma, UserRole } from "@prisma/client";
import { UserFacingError } from "./friendly-errors";

type DeletionUser = { id: string; role: UserRole; companyId: string | null };
export type DeletionTransaction = Pick<Prisma.TransactionClient, "document" | "auditLog">;
export type DocumentDeletionDatabase = {
  $transaction<T>(action: (transaction: DeletionTransaction) => Promise<T>): Promise<T>;
};

export function canDeleteDocuments(user: Pick<DeletionUser, "role">) {
  return user.role === "SUPER_ADMIN" || user.role === "CLIENT_ADMIN";
}

export async function deleteDocumentRecord(database: DocumentDeletionDatabase, user: DeletionUser, documentId: string) {
  if (!canDeleteDocuments(user)) throw new UserFacingError("Sem permissão para excluir documentos.");
  if (!documentId.trim()) throw new UserFacingError("Selecione o documento que deseja excluir.");
  const scope = user.role === "SUPER_ADMIN" && !user.companyId ? {} : { companyId: user.companyId ?? "__none__" };

  // The audit entry and deletion must succeed together. No machine or APR is deleted.
  return database.$transaction(async (transaction) => {
    const document = await transaction.document.findFirst({
      where: { id: documentId, ...scope },
      select: { id: true, name: true, companyId: true, machineId: true, fileUrl: true },
    });
    if (!document) throw new UserFacingError("Documento não encontrado ou sem acesso.");
    await transaction.document.delete({ where: { id: document.id, companyId: document.companyId } });
    await transaction.auditLog.create({
      data: {
        companyId: document.companyId,
        userId: user.id,
        action: "DOCUMENT_DELETED",
        operation: "DELETE",
        entity: "Document",
        entityId: document.id,
        parentId: document.machineId,
        summary: `Documento ${document.name} excluído da máquina.`,
      },
    });
    return document;
  });
}
