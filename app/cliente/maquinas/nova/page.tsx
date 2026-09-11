import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { createMachineAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { listCompanies, listUnits } from "@/lib/data/machines";
import { isSuperAdmin } from "@/lib/auth/session";
import { HrnFields } from "@/app/components/hrn-fields";

export const metadata: Metadata = { title: "Cadastrar máquina" };

export default async function NewMachinePage() {
  const session = await requireClient();
  const [units, companies] = await Promise.all([listUnits(session), isSuperAdmin(session) ? listCompanies() : Promise.resolve([])]);
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">NR-12</span><h1>Cadastro das máquinas e equipamentos</h1><p>Campos da apresentação: equipamento, série, patrimônio/TAG, documento, revisão, setor, ano, fabricante, capacidade, categoria, HRN.</p></div><Link className="button secondary" href="/cliente/maquinas">Voltar</Link></section>
        <form className="panel record-form" action={createMachineAction}>
          {isSuperAdmin(session) && (
            <label>Empresa<select name="companyId" required>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          )}
          <label>Unidade<select name="unitId" required>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <label>Equipamento<input name="name" required placeholder="Inspetora Eletrônica EBI 01" /></label>
          <label>Código<input name="code" required placeholder="EBI-01" /></label>
          <label>Número de série<input name="serial" required /></label>
          <label>Patrimônio/TAG<input name="tag" required /><input type="hidden" name="assetTag" /></label>
          <label>Tipo de máquina<input name="machineType" placeholder="Inspeção de garrafas" /></label>
          <label>Fabricante<input name="manufacturer" required /></label>
          <label>Modelo<input name="model" required /></label>
          <label>Ano de fabricação<input name="year" type="text" required /></label>
          <label>Setor<input name="sector" required /></label>
          <label>Área<input name="area" /></label>
          <label>Capacidade<input name="capacity" /></label>
          <label>Documento<input name="documentNumber" placeholder="APR-001" /></label>
          <label>Revisão<input name="documentRevision" placeholder="1.0" /></label>
          <label>Categoria<select name="category"><option value="B">B</option><option value="CAT_1">1</option><option value="CAT_2">2</option><option value="CAT_3">3</option><option value="CAT_4">4</option></select></label>
          <HrnFields current={80} />
          <label>Status<select name="status"><option value="OPERACIONAL">Operacional</option><option value="EM_MANUTENCAO">Em manutenção</option><option value="INTERDITADA">Interditada</option></select></label>
          <label className="full">Fontes de energia<input name="energySources" placeholder="Elétrica, mecânica e pneumática" /></label>
          <label className="full">Principais sistemas e dispositivos<textarea name="mainSystems" rows={3} /></label>
          <label className="full">Utilização do equipamento<textarea name="usage" rows={2} /></label>
          <label className="full">Características de processo<textarea name="processCharacteristics" rows={2} /></label>
          <label>Operadores<input name="operatorCount" type="number" /></label>
          <label className="full">Função dos operadores<textarea name="operatorSkills" rows={2} /></label>
          <label className="full">Identificação de riscos - Mecânico<textarea name="mechMaintenanceSkills" rows={2} /></label>
          <label className="full">Identificação de riscos - Elétrico<textarea name="elecMaintenanceSkills" rows={2} /></label>
          <label className="full">Observações<textarea name="observations" rows={3} /></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar máquina</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
