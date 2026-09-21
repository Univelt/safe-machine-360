import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { prisma } from "@/lib/prisma";
import { HistoryContent } from "./history-content";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Histórico | Administração" };

export default async function HistoryPage() {
  const session = await requireAdmin();
  const logs = await prisma.auditLog.findMany({ where: session.companyId ? { companyId: session.companyId } : {}, include: { user: true, company: true }, orderBy: { createdAt: "desc" }, take: 500 });
  return (
    <AuthenticatedShell variant="admin">
      <HistoryContent logs={logs.map((log) => ({ id: log.id, createdAt: log.createdAt.toISOString(), action: log.action, entity: log.entity, entityId: log.entityId, summary: log.summary, companyId: log.companyId, companyName: log.company?.name ?? null, userId: log.userId, userName: log.user?.name ?? null, userEmail: log.user?.email ?? null }))} />
    </AuthenticatedShell>
  );
}
