import { formatDateTime } from "../labels";
import { prisma } from "../prisma";

export type LastChange = {
  at: string;
  by: string;
  summary: string;
};

export async function getLastChange(entity: string | string[], entityId: string): Promise<LastChange | null> {
  const entities = Array.isArray(entity) ? entity : [entity];
  const log = await prisma.auditLog.findFirst({
    where: { entity: { in: entities }, entityId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  if (!log) return null;
  return {
    at: formatDateTime(log.createdAt),
    by: log.user?.name || "Portal Univelt",
    summary: log.summary,
  };
}
