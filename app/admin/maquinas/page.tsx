import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { MachinesAdminContent } from "./machines-admin-content";
import { requireAdmin } from "@/lib/auth/guards";
import { listMachines } from "@/lib/data/machines";

export const metadata: Metadata = { title: "Máquinas | Administração" };

export default async function MachinesAdminPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const session = await requireAdmin();
  const machines = await listMachines(session);
  const { company } = await searchParams;
  const initialCompany = company && machines.some((machine) => machine.companyName === company) ? company : "all";
  return <AuthenticatedShell variant="admin"><MachinesAdminContent machines={machines} initialCompany={initialCompany} /></AuthenticatedShell>;
}
