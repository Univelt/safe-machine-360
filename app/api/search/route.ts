import { NextResponse } from "next/server";
import { getSession, isSuperAdmin } from "@/lib/auth/session";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ machines: [], companies: [], users: [] });
  }

  const admin = isSuperAdmin(session);
  const scope = companyFilter(session);
  const [machines, companies, users] = await Promise.all([
    prisma.machine.findMany({
      where: {
        ...scope,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { tag: { contains: query, mode: "insensitive" } },
          { manufacturer: { contains: query, mode: "insensitive" } },
          { company: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      orderBy: { name: "asc" },
      take: 6,
      select: { id: true, name: true, code: true, tag: true, company: { select: { name: true } } },
    }),
    admin
      ? prisma.company.findMany({
          where: { ...(session.companyId ? { id: session.companyId } : {}), name: { contains: query, mode: "insensitive" } },
          orderBy: { name: "asc" },
          take: 5,
          select: { id: true, name: true, city: true },
        })
      : Promise.resolve([]),
    admin
      ? prisma.user.findMany({
          where: {
            ...(session.companyId ? { companyId: session.companyId } : {}),
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: { name: "asc" },
          take: 5,
          select: { id: true, name: true, email: true, company: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    machines: machines.map((machine) => ({
      id: machine.id,
      label: machine.name,
      meta: [machine.code, machine.tag, machine.company.name].filter(Boolean).join(" · "),
      href: admin ? `/cliente/maquinas/${machine.id}` : `/cliente/maquinas/${machine.id}`,
    })),
    companies: companies.map((company) => ({
      id: company.id,
      label: company.name,
      meta: company.city,
      href: `/admin/maquinas?company=${encodeURIComponent(company.name)}`,
    })),
    users: users.map((user) => ({
      id: user.id,
      label: user.name,
      meta: [user.email, user.company?.name].filter(Boolean).join(" · "),
      href: `/admin/usuarios?query=${encodeURIComponent(user.email)}`,
    })),
  });
}
