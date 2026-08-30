import type { Metadata } from "next";
import { AuthenticatedShell } from "./components/authenticated-shell";
import { AdminDashboardContent } from "./admin-dashboard-content";
import { listCompanies } from "@/lib/data/machines";
import { globalMetrics } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Visão geral | Portal Univelt",
  description: "Painel administrativo de segurança de máquinas e documentação NR-12.",
};

export default async function Home() {
  const [companies, metrics] = await Promise.all([listCompanies(), globalMetrics()]);
  return (
    <AuthenticatedShell variant="admin">
      <AdminDashboardContent companies={companies} metrics={metrics} />
    </AuthenticatedShell>
  );
}
