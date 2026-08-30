import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
      <div className="dashboard record-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">{machine.code}</span>
            <h1>{template.name}</h1>
            <p>Itens carregados do banco. Cada resposta fica no histórico da máquina.</p>
          </div>
          <Link className="button secondary" href={`/cliente/maquinas/${machine.id}/checklist`}>Trocar checklist</Link>
        </section>
        <form className="panel record-form" action={createChecklistAction}>
          <input type="hidden" name="machineId" value={machine.id} />
          <input type="hidden" name="templateId" value={template.id} />
          {template.items.map((item) => (
            <label key={item.id} className="full">{item.number}. {item.description}
              <select name={`item-${item.id}`} defaultValue="SIM">
                <option value="SIM">SIM</option>
                <option value="NAO">NÃO</option>
                <option value="PARCIAL">PARCIAL</option>
                <option value="NA">N/A</option>
              </select>
            </label>
          ))}
          <label className="full">Observações<textarea name="notes" rows={3} /></label>
          <div className="form-actions"><button className="button primary" type="submit">Registrar checklist</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
