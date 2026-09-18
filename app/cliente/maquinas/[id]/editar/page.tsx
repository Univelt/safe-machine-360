import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedShell } from "../../../../components/authenticated-shell";
import { MachineForm } from "../../machine-form";
import { requireClient } from "@/lib/auth/guards";
import { canManageCompany, isSuperAdmin } from "@/lib/auth/session";
import { getMachine, listCompanies, listUnits } from "@/lib/data/machines";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const session = await requireClient();
  const machine = await getMachine(session, (await params).id);
  return { title: machine ? `Editar ${machine.name} | Portal Univelt` : "Máquina não encontrada" };
}

export default async function EditMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  if (!canManageCompany(session)) notFound();
  const machine = await getMachine(session, (await params).id);
  if (!machine) notFound();
  const [units, companies] = await Promise.all([
    listUnits(session, machine.companyId),
    isSuperAdmin(session) ? listCompanies() : Promise.resolve([]),
  ]);

  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Cadastro das máquinas</span><h1>Editar máquina</h1><p>Atualize os dados do equipamento. A empresa vinculada permanece a mesma.</p></div><Link className="button secondary" href={`/cliente/maquinas/${machine.id}`}>Voltar</Link></section>
        <MachineForm session={session} machine={machine} companies={companies} units={units} />
      </div>
    </AuthenticatedShell>
  );
}
