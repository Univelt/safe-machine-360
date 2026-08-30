import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
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
      <div className="dashboard admin-list-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Catálogo NR-12</span>
            <h1>Checklists cadastrados</h1>
            <p>Inclua modelos e itens no banco. Depois eles aparecem para preenchimento na ficha da máquina.</p>
          </div>
          {canCreate && <Link className="button primary" href="/cliente/checklists/novo"><Plus size={16} /> Novo checklist</Link>}
        </section>
        <section className="admin-company-grid">
          {templates.length === 0 && <p className="empty-copy">Nenhum checklist cadastrado. Crie o primeiro modelo para começar a preencher nas máquinas.</p>}
          {templates.map((template) => (
            <article className="panel admin-company-card" key={template.id}>
              <header>
                <span className="admin-company-avatar"><ClipboardCheck size={19} /></span>
                <div>
                  <strong>{template.name}</strong>
                  <small>{template.company?.name ?? "Catálogo global Univelt"}</small>
                </div>
              </header>
              <p className="empty-copy">{template.description || "Sem descrição."}</p>
              <dl>
                <div><dt>Itens</dt><dd>{template._count.items}</dd></div>
                <div><dt>Preenchimentos</dt><dd>{template._count.executions}</dd></div>
              </dl>
              <footer>
                <Link className="button secondary" href={`/cliente/checklists/${template.id}`}>Abrir itens</Link>
              </footer>
            </article>
          ))}
        </section>
      </div>
    </AuthenticatedShell>
  );
}
