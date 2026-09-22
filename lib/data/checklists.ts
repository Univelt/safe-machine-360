import type { SessionUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getLastChange } from "./audit";

export function checklistCatalogFilter(session: SessionUser) {
  if (isSuperAdmin(session)) return {};
  if (!session.companyId) return { companyId: "__none__" };
  return {
    OR: [{ companyId: session.companyId }, { companyId: null }],
  };
}

export async function listChecklistTemplates(session: SessionUser, options: { includeInactive?: boolean } = {}) {
  return prisma.checklistTemplate.findMany({
    where: { ...checklistCatalogFilter(session), ...(options.includeInactive ? {} : { isActive: true }) },
    include: {
      company: { select: { name: true } },
      items: { where: options.includeInactive ? {} : { isActive: true }, orderBy: { number: "asc" } },
      _count: { select: { executions: true, items: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getChecklistTemplate(session: SessionUser, id: string) {
  const template = await prisma.checklistTemplate.findFirst({
    where: { id, ...checklistCatalogFilter(session) },
    include: {
      company: { select: { name: true } },
      items: { include: { _count: { select: { answers: true } } }, orderBy: { number: "asc" } },
      _count: { select: { executions: true, items: true } },
    },
  });
  if (!template) return null;
  const lastChange = await getLastChange(["ChecklistTemplate", "ChecklistTemplateItem"], template.id);
  return {
    ...template,
    lastChange: lastChange ?? {
      at: formatDateTime(template.updatedAt),
      by: template.company?.name ?? "Portal Univelt",
    },
  };
}
