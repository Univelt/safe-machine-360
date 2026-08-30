import type { UserRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "univelt_session";
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
  return readSessionToken(token);
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
