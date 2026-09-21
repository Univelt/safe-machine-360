import { requireAdmin, requireClient } from "@/lib/auth/guards";
import { isSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PortalShell } from "./portal-shell";

export async function AuthenticatedShell({
  variant,
  children,
}: {
  variant: "admin" | "client";
  children: React.ReactNode;
}) {
  const session = variant === "admin" ? await requireAdmin() : await requireClient();
  const admin = isSuperAdmin(session);
  const companyOptions = admin
    ? await prisma.company.findMany({
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];
  return (
    <PortalShell variant={admin ? "admin" : variant} session={session} companyOptions={companyOptions}>
      {children}
    </PortalShell>
  );
}
