import type { SessionUser } from "@/lib/auth/session";

export function canManageChecklistTemplate(session: SessionUser | null | undefined, companyId: string | null) {
  if (!session) return false;
  if (session.role === "SUPER_ADMIN") return true;
  if (session.role !== "CLIENT_ADMIN" && session.role !== "CLIENT_MANAGER") return false;
  return Boolean(companyId && session.companyId === companyId);
}
