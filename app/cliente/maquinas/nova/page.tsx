import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { listCompanies, listUnits } from "@/lib/data/machines";
import { MachineForm } from "../machine-form";
import { isSuperAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Cadastrar máquina" };

export default async function NewMachinePage() {
  const session = await requireClient();
  const [units, companies] = await Promise.all([listUnits(session), isSuperAdmin(session) ? listCompanies() : Promise.resolve([])]);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">NR-12</span><h1>Cadastro das máquinas e equipamentos</h1><p>Campos da apresentação: equipamento, série, patrimônio/TAG, documento, revisão, setor, ano, fabricante, capacidade, categoria, HRN.</p></div><Link className="button secondary" href="/cliente/maquinas">Voltar</Link></section>
        <MachineForm session={session} companies={companies} units={units} />
      </div>
    </AuthenticatedShell>
  );
}
