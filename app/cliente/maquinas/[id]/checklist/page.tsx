import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { AuthenticatedShell } from "../../../../components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { getMachine } from "@/lib/data/machines";
import { listChecklistTemplates } from "@/lib/data/checklists";

export const metadata: Metadata = { title: "Escolher checklist" };

export default async function ChooseChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const machine = await getMachine(session, (await params).id);
  if (!machine) notFound();
  const templates = await listChecklistTemplates(session);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Checklist da máquina</span>
            <h1>Preencher checklist de {machine.code}</h1>
            <p>Escolha um modelo cadastrado no banco. Se precisar de outros itens, cadastre um novo checklist.</p>
          </div>
          <div className="heading-actions">
            <Link className="button secondary" href={`/cliente/maquinas/${machine.id}`}>Voltar</Link>
            <Link className="button primary" href="/cliente/checklists/novo">Cadastrar checklist</Link>
          </div>
        </section>
        <section className="admin-company-grid">
          {templates.length === 0 && <p className="empty-copy">Nenhum checklist cadastrado ainda. Crie um modelo para preenchê-lo nesta máquina.</p>}
          {templates.map((template) => (
            <article className="panel admin-company-card" key={template.id}>
              <header>
                <span className="admin-company-avatar"><ClipboardCheck size={19} /></span>
                <div>
                  <strong>{template.name}</strong>
                  <small>{template._count.items} itens</small>
                </div>
              </header>
              <p className="empty-copy">{template.description || "Itens vindos do cadastro do checklist."}</p>
              <footer>
                {template._count.items > 0
                  ? <Link className="button primary" href={`/cliente/maquinas/${machine.id}/checklist/${template.id}`}>Preencher</Link>
                  : <Link className="button secondary" href={`/cliente/checklists/${template.id}`}>Adicionar itens</Link>}
              </footer>
            </article>
          ))}
        </section>
      </div>
    </AuthenticatedShell>
  );
}
