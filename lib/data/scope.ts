import type { SessionUser } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/session";

export function companyFilter(session: SessionUser) {
  if (isSuperAdmin(session)) return {};
  if (!session.companyId) return { companyId: "__none__" };
  return { companyId: session.companyId };
}
