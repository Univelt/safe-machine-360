import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedShell } from "../../../../components/authenticated-shell";
import { createActionPlanAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { getMachine } from "@/lib/data/machines";
import { ActionPlanDraftAttachments } from "./action-plan-draft-attachments";

export const metadata: Metadata = { title: "Plano de ação NR-12" };

export default async function NewActionPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const machine = await getMachine(session, (await params).id);
  if (!machine) notFound();
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Plano de ação NR-12</span><h1>{machine.code}</h1><p>Não conformidade, ação, responsável e referência do projeto conceitual.</p></div><Link className="button secondary" href={`/cliente/maquinas/${machine.id}`}>Voltar</Link></section>
        <form className="panel record-form" action={createActionPlanAction}>
          <input type="hidden" name="machineId" value={machine.id} />
          <label className="full">Título<input name="title" defaultValue={`Plano de ação ${machine.code}`} /></label>
          <label>Local / categoria<input name="location" placeholder="Perigo mecânico" required /></label>
          <label className="full">Não conformidade / sugestão<textarea name="nonconformity" rows={3} required /></label>
          <label className="full">Ação<textarea name="action" rows={3} required /></label>
          <label>Referência<input name="reference" placeholder="Projeto conceitual" /></label>
          <label>Responsável<input name="responsible" required defaultValue={session.name} /></label>
          <label className="full">Checklist relacionado<select name="checklistExecutionId" defaultValue=""><option value="">Plano geral da máquina</option>{machine.checklists.map((execution) => <option key={execution.id} value={execution.id}>{execution.template.name} · {new Intl.DateTimeFormat("pt-BR").format(execution.executedAt)}</option>)}</select></label>
          <ActionPlanDraftAttachments />
          <div className="form-actions"><button className="button primary" type="submit">Salvar plano</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
