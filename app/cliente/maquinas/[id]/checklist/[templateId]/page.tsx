import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { AuthenticatedShell } from "../../../../../components/authenticated-shell";
import { createChecklistAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { getMachine } from "@/lib/data/machines";
import { getChecklistTemplate } from "@/lib/data/checklists";

export const metadata: Metadata = { title: "Preencher checklist" };

export default async function FillChecklistPage({ params }: { params: Promise<{ id: string; templateId: string }> }) {
  const session = await requireClient();
  const { id, templateId } = await params;
  const [machine, template] = await Promise.all([
    getMachine(session, id),
    getChecklistTemplate(session, templateId),
  ]);
  if (!machine || !template || template.items.length === 0) notFound();
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard checklist-detail-page">
        <div className="breadcrumb">
          <span>{machine.companyName}</span>
          <ChevronRight size={14} />
          <Link href={`/cliente/maquinas/${machine.id}`}>{machine.code}</Link>
          <ChevronRight size={14} />
          <strong>Checklist</strong>
        </div>
        <section className="checklist-hero">
          <span className="checklist-hero-icon"><ClipboardCheck size={30} /></span>
          <div>
            <div className="checklist-hero-labels">
              <span className="document-type">{machine.code}</span>
              <span className="doc-pill neutral">{template.items.length} itens</span>
            </div>
            <h1>{template.name}</h1>
            <p>Itens carregados do banco. Cada resposta fica no histórico da máquina.</p>
          </div>
          <div className="checklist-hero-actions">
            <Link className="button secondary" href={`/cliente/maquinas/${machine.id}/checklist`}>Trocar checklist</Link>
          </div>
        </section>
        <form className="panel checklist-items-panel" action={createChecklistAction}>
          <input type="hidden" name="machineId" value={machine.id} />
          <input type="hidden" name="templateId" value={template.id} />
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Verificação</span>
              <h2>Responda cada item</h2>
            </div>
            <small>{machine.name}</small>
          </div>
          <ol className="checklist-item-list fill">
            {template.items.map((item) => (
              <li key={item.id}>
                <span className="checklist-num">{String(item.number).padStart(2, "0")}</span>
                <p>{item.description}</p>
                <label>
                  <span className="sr-only">Resposta do item {item.number}</span>
                  <select name={`item-${item.id}`} defaultValue="SIM">
                    <option value="SIM">Sim</option>
                    <option value="NAO">Não</option>
                    <option value="PARCIAL">Parcial</option>
                    <option value="NA">N/A</option>
                  </select>
                </label>
              </li>
            ))}
          </ol>
          <label className="checklist-notes">
            Observações
            <textarea name="notes" rows={3} placeholder="Registre restrições, pendências ou evidências desta verificação." />
          </label>
          <div className="form-actions checklist-fill-actions">
            <button className="button primary" type="submit">Registrar checklist</button>
          </div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
