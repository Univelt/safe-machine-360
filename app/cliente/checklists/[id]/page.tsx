import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { ChangeLog } from "../../../components/change-log";
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
      <div className="dashboard checklist-detail-page">
        <div className="breadcrumb">
          <span>{session.companyName ?? "Empresa"}</span>
          <ChevronRight size={14} />
          <Link href="/cliente/checklists">Checklists</Link>
          <ChevronRight size={14} />
          <strong>{template.name}</strong>
        </div>
        <section className="checklist-hero">
          <span className="checklist-hero-icon"><ClipboardCheck size={30} /></span>
          <div>
            <div className="checklist-hero-labels">
              <span className="document-type">Catálogo NR-12</span>
              <span className="doc-pill neutral">{template.items.length} itens</span>
              <span className="doc-pill neutral">{template._count.executions} preenchimentos</span>
            </div>
            <h1>{template.name}</h1>
            <p>{template.description || "Itens gravados no banco para uso nas máquinas."}</p>
          </div>
          <div className="checklist-hero-actions">
            <Link className="button secondary" href="/cliente/checklists">Voltar</Link>
          </div>
        </section>

        <section className="panel checklist-items-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Itens de verificação</span>
              <h2>Lista do modelo</h2>
            </div>
            <small>{template.company?.name ?? "Catálogo global Univelt"}</small>
          </div>
          {template.items.length === 0 ? (
            <p className="empty-copy checklist-empty">Nenhum item ainda. Adicione o primeiro abaixo.</p>
          ) : (
            <ol className="checklist-item-list">
              {template.items.map((item) => (
                <li key={item.id}>
                  <span className="checklist-num">{String(item.number).padStart(2, "0")}</span>
                  <p>{item.description}</p>
                </li>
              ))}
            </ol>
          )}
          {canEdit && (
            <form className="checklist-add-item" action={addChecklistItemAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <label>
                Novo item
                <textarea name="description" rows={2} required placeholder="Descrição do item de verificação" />
              </label>
              <button className="button primary" type="submit">Adicionar item</button>
            </form>
          )}
          <ChangeLog at={template.lastChange?.at} by={template.lastChange?.by} />
        </section>
      </div>
    </AuthenticatedShell>
  );
}
