import type { SessionUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/session";
import { riskLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export async function getChecklistDashboardData(session: SessionUser) {
  const scope = isSuperAdmin(session) ? {} : { companyId: session.companyId ?? "__none__" };
  const [companies, machines, templates, executions] = await Promise.all([
    prisma.company.findMany({
      where: isSuperAdmin(session) ? { status: "ACTIVE" } : { id: session.companyId ?? "__none__" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.machine.findMany({
      where: scope,
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
      select: { id: true, code: true, name: true, sector: true, riskLevel: true, companyId: true, company: { select: { name: true } } },
    }),
    prisma.checklistTemplate.findMany({
      where: {
        isActive: true,
        ...(isSuperAdmin(session) ? {} : { OR: [{ companyId: session.companyId }, { companyId: null }] }),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, companyId: true, _count: { select: { items: { where: { isActive: true } } } } },
    }),
    prisma.checklistExecution.findMany({
      where: scope,
      orderBy: { executedAt: "desc" },
      select: {
        id: true,
        executedAt: true,
        executedBy: true,
        notes: true,
        company: { select: { id: true, name: true } },
        machine: { select: { id: true, code: true, name: true, sector: true, riskLevel: true } },
        template: { select: { id: true, name: true } },
        answers: { select: { id: true, result: true, itemId: true, item: { select: { number: true, description: true } } } },
      },
    }),
  ]);

  return {
    initialCompanyId: session.companyId,
    canSelectCompany: isSuperAdmin(session),
    companies,
    machines: machines.map((machine) => ({
      id: machine.id,
      code: machine.code,
      name: machine.name,
      sector: machine.sector,
      companyId: machine.companyId,
      companyName: machine.company.name,
      riskLevel: machine.riskLevel,
      riskLabel: riskLabels[machine.riskLevel],
    })),
    templates: templates.map((template) => ({ id: template.id, name: template.name, companyId: template.companyId, activeItems: template._count.items })),
    executions: executions.map((execution) => ({
      ...execution,
      executedAt: execution.executedAt.toISOString(),
      riskLabel: riskLabels[execution.machine.riskLevel],
    })),
  };
}

export type ChecklistDashboardData = Awaited<ReturnType<typeof getChecklistDashboardData>>;
