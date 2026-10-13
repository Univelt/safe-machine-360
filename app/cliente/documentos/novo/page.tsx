import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { listMachines } from "@/lib/data/machines";
import { isSuperAdmin } from "@/lib/auth/session";
import { CompanyContextRequired } from "@/app/components/company-context-required";
import { DocumentCreateForm } from "./document-create-form";

export const metadata: Metadata = { title: "Cadastrar documento" };

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ machineId?: string }> }) {
  const session = await requireClient();
  if (isSuperAdmin(session) && !session.companyId) {
    return <AuthenticatedShell variant="client"><CompanyContextRequired action="vincular um documento" /></AuthenticatedShell>;
  }
  const machineId = (await searchParams).machineId;
  const machines = await listMachines(session);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Documentos</span><h1>Vincular documento à máquina</h1><p>Todo documento fica associado a um equipamento da empresa.</p></div><Link className="button secondary" href="/cliente/documentos">Voltar</Link></section>
        <DocumentCreateForm
          machines={machines.map(({ id, code, name }) => ({ id, code, name }))}
          defaultMachineId={machineId}
          responsible={session.name}
        />
      </div>
    </AuthenticatedShell>
  );
}
