import { NextResponse } from "next/server";
import { getSession, COMPANY_CONTEXT_COOKIE, isSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { companyId?: string | null } | null;
  const companyId = body?.companyId?.trim() || null;

  if (companyId) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada ou inativa." }, { status: 404 });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COMPANY_CONTEXT_COOKIE, companyId ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_SECURE_COOKIE === "true",
    path: "/",
    maxAge: companyId ? 60 * 60 * 12 : 0,
  });
  return response;
}
