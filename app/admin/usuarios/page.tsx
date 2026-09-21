import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { UsersAdminContent } from "./users-admin-content";
import { listUsers } from "@/lib/data/machines";
import { globalMetrics } from "@/lib/data/catalog";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Usuários | Administração" };

export default async function UsersAdminPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const session = await requireAdmin();
  const [allUsers, metrics, { query }] = await Promise.all([listUsers(), globalMetrics(session), searchParams]);
  const users = session.companyId ? allUsers.filter((user) => user.companyId === session.companyId) : allUsers;
  return (
    <AuthenticatedShell variant="admin">
      <UsersAdminContent
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          lastAccessAt: user.lastAccessAt,
          companyName: user.company?.name ?? "Univelt Machine Safety",
        }))}
        metrics={metrics}
        initialQuery={query}
      />
    </AuthenticatedShell>
  );
}
