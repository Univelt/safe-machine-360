import { notFound, redirect } from "next/navigation";
import type { SessionUser } from "./session";
import { getSession, isSuperAdmin } from "./session";

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isSuperAdmin(session)) redirect("/cliente");
  return session;
}

export async function requireClient() {
  const session = await requireSession();
  if (isSuperAdmin(session)) return session;
  if (!session.companyId) redirect("/login");
  return session;
}

export function scopedCompanyId(session: SessionUser, requested?: string | null) {
  if (isSuperAdmin(session)) return requested ?? null;
  return session.companyId;
}

export function assertCompanyAccess(session: SessionUser, companyId: string) {
  if (isSuperAdmin(session)) return;
  if (session.companyId !== companyId) notFound();
}
