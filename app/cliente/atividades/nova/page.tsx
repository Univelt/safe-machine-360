import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { createActivityAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { listMachines } from "@/lib/data/machines";

export const metadata: Metadata = { title: "Nova atividade" };

export default async function NewActivityPage() {
  const session = await requireClient();
  const machines = await listMachines(session);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Atividade e histórico NR-12</span><h1>Cadastrar atividade</h1><p>Responsável, e-mail, data prevista, data executada e evidência (doc/foto).</p></div><Link className="button secondary" href="/cliente/atividades">Voltar</Link></section>
        <form className="panel record-form" action={createActivityAction}>
          <label className="full">Máquina<select name="machineId" required>{machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.code} · {machine.name}</option>)}</select></label>
          <label className="full">Título<input name="title" required /></label>
          <label>Tipo<input name="type" defaultValue="Ação corretiva" /></label>
          <label>Prioridade<select name="priority"><option value="MEDIA">Média</option><option value="BAIXA">Baixa</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></select></label>
          <label>Status<select name="status"><option value="ABERTA">Aberta</option><option value="EM_ANDAMENTO">Em andamento</option><option value="CONCLUIDA">Concluída</option><option value="ATRASADA">Atrasada</option></select></label>
          <label>Responsável<input name="responsible" required defaultValue={session.name} /></label>
          <label>E-mail do responsável<input name="responsibleEmail" type="email" /></label>
          <label>Data prevista<input name="dueDate" type="date" required /></label>
          <label>Data executada<input name="executedAt" type="date" /></label>
          <label>Progresso inicial (%)<input name="progress" type="number" min="0" max="100" defaultValue={0} /></label>
          <label className="full">Descrição<textarea name="description" rows={4} required /></label>
          <label className="full file-field">Evidência<input name="file" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp" /><small>PDF, imagem, Word ou Excel até 20 MB. Depois você pode anexar mais na ficha da atividade.</small></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar atividade</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
