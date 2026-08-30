import type { Metadata } from "next";
import { AuthenticatedShell } from "../components/authenticated-shell";
import { ClientDashboardContent } from "./client-dashboard-content";
import { requireClient } from "@/lib/auth/guards";
import { companyMetrics, listActivities } from "@/lib/data/catalog";
import { listMachines } from "@/lib/data/machines";

export const metadata: Metadata = {
  title: "Área do cliente | Portal Univelt",
  description: "Painel da empresa para acompanhamento de máquinas e documentos NR-12.",
};

export default async function ClientPortalPage() {
  const session = await requireClient();
  const [metrics, machines, activities] = await Promise.all([
    companyMetrics(session),
    listMachines(session),
    listActivities(session),
  ]);
  return (
    <AuthenticatedShell variant="client">
      <ClientDashboardContent
        name={session.name}
        companyName={session.companyName ?? "Sua empresa"}
        unitName={session.unitName ?? "Unidade"}
        metrics={metrics}
        machines={machines}
        activities={activities}
      />
    </AuthenticatedShell>
  );
}
