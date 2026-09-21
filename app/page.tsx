import type { Metadata } from "next";
import { AuthenticatedShell } from "./components/authenticated-shell";
import { AdminDashboardContent } from "./admin-dashboard-content";
import { listCompanies } from "@/lib/data/machines";
import { globalMetrics } from "@/lib/data/catalog";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Visão geral | Portal Univelt",
  description: "Painel administrativo de segurança de máquinas e documentação NR-12.",
};

export default async function Home() {
  const session = await requireAdmin();
  const [allCompanies, metrics] = await Promise.all([listCompanies(), globalMetrics(session)]);
  const companies = session.companyId ? allCompanies.filter((company) => company.id === session.companyId) : allCompanies;
  return (
    <AuthenticatedShell variant="admin">
      <AdminDashboardContent companies={companies} metrics={metrics} contextName={session.companyName} />
    </AuthenticatedShell>
  );
}
