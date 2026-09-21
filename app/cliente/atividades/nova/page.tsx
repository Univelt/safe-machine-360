import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { listMachines } from "@/lib/data/machines";
import { ActivityForm } from "./activity-form";
import { isSuperAdmin } from "@/lib/auth/session";
import { CompanyContextRequired } from "@/app/components/company-context-required";

export const metadata: Metadata = { title: "Nova atividade" };

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ machineId?: string }> }) {
  const session = await requireClient();
  if (isSuperAdmin(session) && !session.companyId) {
    return <AuthenticatedShell variant="client"><CompanyContextRequired action="cadastrar uma atividade" /></AuthenticatedShell>;
  }
  const machines = await listMachines(session);
  const { machineId } = await searchParams;
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Atividade e histórico NR-12</span><h1>Cadastrar atividade</h1><p>Responsável, e-mail, data prevista, data executada e evidência (doc/foto).</p></div><Link className="button secondary" href="/cliente/atividades">Voltar</Link></section>
        <ActivityForm
          machines={machines.map((machine) => ({ id: machine.id, name: machine.name, code: machine.code, tag: machine.tag, companyName: machine.companyName }))}
          initialMachineId={machineId}
          defaultResponsible={session.name}
        />
      </div>
    </AuthenticatedShell>
  );
}
