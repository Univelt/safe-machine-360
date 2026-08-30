import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { MachinesAdminContent } from "./machines-admin-content";
import { requireAdmin } from "@/lib/auth/guards";
import { listMachines } from "@/lib/data/machines";

export const metadata: Metadata = { title: "Máquinas | Administração" };

export default async function MachinesAdminPage() {
  const session = await requireAdmin();
  const machines = await listMachines(session);
  return <AuthenticatedShell variant="admin"><MachinesAdminContent machines={machines} /></AuthenticatedShell>;
}
