import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { UsersAdminContent } from "./users-admin-content";
import { listUsers } from "@/lib/data/machines";
import { globalMetrics } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Usuários | Administração" };

export default async function UsersAdminPage() {
  const [users, metrics] = await Promise.all([listUsers(), globalMetrics()]);
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
      />
    </AuthenticatedShell>
  );
}
