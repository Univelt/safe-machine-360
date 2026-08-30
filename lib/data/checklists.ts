import type { SessionUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export function checklistCatalogFilter(session: SessionUser) {
  if (isSuperAdmin(session)) return {};
  if (!session.companyId) return { companyId: "__none__" };
  return {
    OR: [{ companyId: session.companyId }, { companyId: null }],
  };
}

export async function listChecklistTemplates(session: SessionUser) {
  return prisma.checklistTemplate.findMany({
    where: checklistCatalogFilter(session),
    include: {
      company: { select: { name: true } },
      items: { orderBy: { number: "asc" } },
      _count: { select: { executions: true, items: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getChecklistTemplate(session: SessionUser, id: string) {
  return prisma.checklistTemplate.findFirst({
    where: { id, ...checklistCatalogFilter(session) },
    include: {
      company: { select: { name: true } },
      items: { orderBy: { number: "asc" } },
    },
  });
}
