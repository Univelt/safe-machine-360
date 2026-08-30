import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { createDocumentAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { listMachines } from "@/lib/data/machines";

export const metadata: Metadata = { title: "Cadastrar documento" };

export default async function NewDocumentPage({ searchParams }: { searchParams: Promise<{ machineId?: string }> }) {
  const session = await requireClient();
  const machineId = (await searchParams).machineId;
  const machines = await listMachines(session);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Documentos</span><h1>Vincular documento à máquina</h1><p>Todo documento fica associado a um equipamento da empresa.</p></div><Link className="button secondary" href="/cliente/documentos">Voltar</Link></section>
        <form className="panel record-form" action={createDocumentAction}>
          <label className="full">Máquina<select name="machineId" required defaultValue={machineId}>{machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.code} · {machine.name}</option>)}</select></label>
          <label className="full">Nome<input name="name" required /></label>
          <label>Tipo<select name="type"><option value="APRECIACAO_RISCO">Apreciação de risco</option><option value="APR">APR</option><option value="CHECKLIST_SEGURANCA">Checklist de segurança</option><option value="CHECKLIST_MANUTENCAO">Checklist de manutenção</option><option value="MANUAL">Manual</option><option value="LAUDO">Laudo</option><option value="ART">ART</option><option value="OUTRO">Outro</option></select></label>
          <label>Versão<input name="version" defaultValue="1.0" /></label>
          <label>Emissão<input name="issueDate" type="date" required /></label>
          <label>Validade<input name="expirationDate" type="date" /></label>
          <label>Responsável<input name="responsible" defaultValue={session.name} /></label>
          <label className="full">Descrição<textarea name="description" rows={3} /></label>
          <label className="full file-field">Anexo<input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp" /><small>PDF, imagem, Word ou Excel até 20 MB. O arquivo fica restrito à empresa da sessão.</small></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar documento</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
