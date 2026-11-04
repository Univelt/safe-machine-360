import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthenticatedShell } from "../../../../components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { getDocument } from "@/lib/data/catalog";
import { listMachines } from "@/lib/data/machines";
import { DocumentEditForm } from "./document-edit-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const session = await requireClient();
  const document = await getDocument(session, (await params).id);
  return { title: document ? `Editar ${document.name} | Portal Univelt` : "Documento não encontrado" };
}

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  if (!canMutateOperations(session)) notFound();
  const document = await getDocument(session, (await params).id);
  if (!document) notFound();
  const machines = (await listMachines(session))
    .filter((machine) => machine.companyId === document.companyId)
    .map(({ id, code, name }) => ({ id, code, name }));

  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Documentos</span><h1>Editar documento</h1><p>Atualize os dados do cadastro. O arquivo já anexado permanece o mesmo.</p></div><Link className="button secondary" href={`/cliente/documentos/${document.id}`}>Voltar</Link></section>
        <DocumentEditForm document={document} machines={machines} />
      </div>
    </AuthenticatedShell>
  );
}
