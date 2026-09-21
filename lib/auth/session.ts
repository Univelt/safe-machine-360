import type { UserRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "univelt_session";
export const COMPANY_CONTEXT_COOKIE = "univelt_company_context";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
  unitId: string | null;
  unitName: string | null;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.id || !payload.email || !payload.role) return null;
    return {
      id: String(payload.id),
      name: String(payload.name ?? ""),
      email: String(payload.email),
      role: payload.role as UserRole,
      companyId: payload.companyId ? String(payload.companyId) : null,
      companyName: payload.companyName ? String(payload.companyName) : null,
      unitId: payload.unitId ? String(payload.unitId) : null,
      unitName: payload.unitName ? String(payload.unitName) : null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await readSessionToken(token);
  if (!session || session.role !== "SUPER_ADMIN") return session;

  const companyId = jar.get(COMPANY_CONTEXT_COOKIE)?.value;
  if (!companyId) {
    return {
      ...session,
      companyId: null,
      companyName: null,
      unitId: null,
      unitName: null,
    };
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      units: { orderBy: { name: "asc" }, take: 1, select: { id: true, name: true } },
    },
  });
  if (!company) {
    return {
      ...session,
      companyId: null,
      companyName: null,
      unitId: null,
      unitName: null,
    };
  }

  return {
    ...session,
    companyId: company.id,
    companyName: company.name,
    unitId: company.units[0]?.id ?? null,
    unitName: company.units[0]?.name ?? null,
  };
}

export function isSuperAdmin(user: SessionUser | null | undefined) {
  return user?.role === "SUPER_ADMIN";
}

export function canManageCompany(user: SessionUser | null | undefined) {
  return user?.role === "SUPER_ADMIN" || user?.role === "CLIENT_ADMIN";
}

export function canMutateOperations(user: SessionUser | null | undefined) {
  return user?.role === "SUPER_ADMIN" || user?.role === "CLIENT_ADMIN" || user?.role === "CLIENT_MANAGER";
}

export function homePathFor(user: SessionUser) {
  return user.role === "SUPER_ADMIN" ? "/" : "/cliente";
}
