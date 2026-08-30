import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { MachinesContent } from "./machines-content";
import { requireClient } from "@/lib/auth/guards";
import { canManageCompany } from "@/lib/auth/session";
import { listMachines } from "@/lib/data/machines";

export const metadata: Metadata = {
  title: "Máquinas | Área do cliente",
  description: "Consulta do parque de máquinas da empresa vinculada.",
};

export default async function MachinesPage() {
  const session = await requireClient();
  const machines = await listMachines(session);
  return (
    <AuthenticatedShell variant="client">
      <MachinesContent machines={machines} companyName={session.companyName ?? "Empresa"} canCreate={canManageCompany(session)} />
    </AuthenticatedShell>
  );
}
