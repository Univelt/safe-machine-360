import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { ChangeLog } from "../../../components/change-log";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations, isSuperAdmin } from "@/lib/auth/session";
import { getChecklistTemplate } from "@/lib/data/checklists";
import { ChecklistTemplateItems } from "./checklist-template-items";
import { ChecklistTemplateManagement } from "./checklist-template-management";

export const metadata: Metadata = { title: "Itens do checklist" };

export default async function ChecklistTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const template = await getChecklistTemplate(session, (await params).id);
  if (!template) notFound();
  const canEdit = canMutateOperations(session) && (isSuperAdmin(session) || template.companyId === session.companyId);
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
            <ChecklistTemplateManagement template={{ id: template.id, name: template.name, description: template.description, isActive: template.isActive, executions: template._count.executions }} canEdit={canEdit} />
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
          <ChecklistTemplateItems templateId={template.id} items={template.items} canEdit={canEdit && template.isActive} />
          <ChangeLog at={template.lastChange?.at} by={template.lastChange?.by} />
        </section>
      </div>
    </AuthenticatedShell>
  );
}
