import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { addChecklistItemAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { getChecklistTemplate } from "@/lib/data/checklists";

export const metadata: Metadata = { title: "Itens do checklist" };

export default async function ChecklistTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const template = await getChecklistTemplate(session, (await params).id);
  if (!template) notFound();
  const canEdit = canMutateOperations(session);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Catálogo NR-12</span>
            <h1>{template.name}</h1>
            <p>{template.description || "Itens gravados no banco para uso nas máquinas."}</p>
          </div>
          <Link className="button secondary" href="/cliente/checklists">Voltar</Link>
        </section>
        <section className="panel detail-section">
          <div className="checklist-table">
            <header><span>Item</span><span>Descrição</span><span>Origem</span></header>
            {template.items.length === 0 && <p className="empty-copy">Nenhum item ainda. Adicione o primeiro abaixo.</p>}
            {template.items.map((item) => (
              <div key={item.id}><span>{item.number}</span><span>{item.description}</span><strong>Banco</strong></div>
            ))}
          </div>
        </section>
        {canEdit && (
          <form className="panel record-form" action={addChecklistItemAction}>
            <input type="hidden" name="templateId" value={template.id} />
            <label className="full">Novo item<textarea name="description" rows={2} required placeholder="Descrição do item de verificação" /></label>
            <div className="form-actions"><button className="button primary" type="submit">Adicionar item</button></div>
          </form>
        )}
      </div>
    </AuthenticatedShell>
  );
}
