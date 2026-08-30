import { requireAdmin, requireClient } from "@/lib/auth/guards";
import { PortalShell } from "./portal-shell";

export async function AuthenticatedShell({
  variant,
  children,
}: {
  variant: "admin" | "client";
  children: React.ReactNode;
}) {
  const session = variant === "admin" ? await requireAdmin() : await requireClient();
  return (
    <PortalShell variant={variant} session={session}>
      {children}
    </PortalShell>
  );
}
