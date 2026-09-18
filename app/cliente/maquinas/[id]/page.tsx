import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { MachineDetails } from "./machine-details";
import { requireClient } from "@/lib/auth/guards";
import { canManageCompany, canMutateOperations } from "@/lib/auth/session";
import { getMachine } from "@/lib/data/machines";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const session = await requireClient();
  const machine = await getMachine(session, (await params).id);
  return { title: machine ? `${machine.name} | Portal Univelt` : "Máquina não encontrada" };
}

export default async function MachineDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const machine = await getMachine(session, (await params).id);
  if (!machine) notFound();
  return (
    <AuthenticatedShell variant="client">
      <MachineDetails machine={machine} canMutate={canMutateOperations(session)} canManage={canManageCompany(session)} />
    </AuthenticatedShell>
  );
}
