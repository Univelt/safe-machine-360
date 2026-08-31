import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, Plus } from "lucide-react";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { listChecklistTemplates } from "@/lib/data/checklists";

export const metadata: Metadata = { title: "Checklists | Portal Univelt" };

export default async function ChecklistsPage() {
  const session = await requireClient();
  const templates = await listChecklistTemplates(session);
  const canCreate = canMutateOperations(session);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard checklists-page">
        <div className="breadcrumb"><span>{session.companyName ?? "Empresa"}</span><ChevronRight size={14} /><strong>Checklists</strong></div>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Catálogo NR-12</span>
            <h1>Checklists cadastrados</h1>
            <p>Inclua modelos e itens no banco. Depois eles aparecem para preenchimento na ficha da máquina.</p>
          </div>
          {canCreate && <Link className="button primary" href="/cliente/checklists/novo"><Plus size={16} /> Novo checklist</Link>}
        </section>
        <section className="panel checklist-catalog">
          {templates.length === 0 && (
            <div className="machine-empty">
              <ClipboardCheck size={28} />
              <strong>Nenhum checklist cadastrado</strong>
              <p>Crie o primeiro modelo para começar a preencher nas máquinas.</p>
            </div>
          )}
          {templates.map((template) => (
            <article className="checklist-catalog-row" key={template.id}>
              <span className="checklist-catalog-icon"><ClipboardCheck size={20} /></span>
              <div>
                <strong>{template.name}</strong>
                <p>{template.description || "Sem descrição."}</p>
                <small>{template.company?.name ?? "Catálogo global Univelt"}</small>
              </div>
              <dl>
                <div><dt>Itens</dt><dd>{template._count.items}</dd></div>
                <div><dt>Preenchimentos</dt><dd>{template._count.executions}</dd></div>
              </dl>
              <Link className="button secondary" href={`/cliente/checklists/${template.id}`}>Abrir itens</Link>
            </article>
          ))}
        </section>
      </div>
    </AuthenticatedShell>
  );
}
