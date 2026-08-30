import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AuthenticatedShell } from "../../../../components/authenticated-shell";
import { createRiskAssessmentAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { getMachine } from "@/lib/data/machines";

export const metadata: Metadata = { title: "Cadastrar APR" };

export default async function NewAprPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const machine = await getMachine(session, (await params).id);
  if (!machine) notFound();
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Análise de risco</span><h1>APR de {machine.code}</h1><p>Número do documento, revisão, categoria B/1/2/3/4, HRN atual e residual.</p></div><Link className="button secondary" href={`/cliente/maquinas/${machine.id}`}>Voltar</Link></section>
        <form className="panel record-form" action={createRiskAssessmentAction}>
          <input type="hidden" name="machineId" value={machine.id} />
          <label>Número do documento (APR)<input name="documentNumber" required defaultValue={machine.documentNumber ?? ""} /></label>
          <label>Revisão<input name="revision" required defaultValue={machine.documentRevision ?? "1.0"} /></label>
          <label>Categoria<select name="category"><option value="B">B</option><option value="CAT_1">1</option><option value="CAT_2">2</option><option value="CAT_3">3</option><option value="CAT_4">4</option></select></label>
          <label>HRN atual<input name="hrnCurrent" type="number" required defaultValue={machine.hrn} /></label>
          <label>HRN residual<input name="hrnResidual" type="number" required defaultValue={machine.hrnResidual ?? 0} /></label>
          <label>Nível de risco<select name="riskLevel"><option value="ALTO">Alto</option><option value="MUITO_ALTO">Muito alto</option><option value="SIGNIFICATIVO">Significativo</option><option value="BAIXO">Baixo</option><option value="MUITO_BAIXO">Muito baixo</option></select></label>
          <label>Emissão<input name="issuedAt" type="date" required /></label>
          <label>Validade<input name="expiresAt" type="date" /></label>
          <label className="full">Observações / limite do equipamento<textarea name="notes" rows={4} defaultValue={machine.equipmentLimits ?? ""} /></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar APR</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
