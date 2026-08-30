import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { ReportsContent } from "./reports-content";
import { requireClient } from "@/lib/auth/guards";
import { companyMetrics } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Relatórios | Área do cliente", description: "Visão executiva de segurança e conformidade NR-12." };

export default async function ReportsPage() {
  const session = await requireClient();
  const metrics = await companyMetrics(session);
  return <AuthenticatedShell variant="client"><ReportsContent companyName={session.companyName ?? "Empresa"} metrics={metrics} /></AuthenticatedShell>;
}
