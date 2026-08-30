import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { homePathFor, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string; remember?: boolean } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true, unit: true },
  });
  if (!user || user.status === "INACTIVE") {
    return NextResponse.json({ error: "E-mail ou senha não conferem." }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "E-mail ou senha não conferem." }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastAccessAt: new Date() } });
  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company?.name ?? null,
    unitId: user.unitId,
    unitName: user.unit?.name ?? null,
  };
  const token = await signSession(sessionUser);
  const response = NextResponse.json({ ok: true, redirectTo: homePathFor(sessionUser) });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_SECURE_COOKIE === "true",
    path: "/",
    maxAge: body?.remember ? 60 * 60 * 24 * 7 : SESSION_MAX_AGE,
  });
  return response;
}
