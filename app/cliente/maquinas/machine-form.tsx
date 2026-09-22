import type { MachineView } from "@/lib/data/types";
import { HrnFields } from "@/app/components/hrn-fields";
import { createMachineAction, updateMachineAction } from "@/app/actions/records";
import { isSuperAdmin } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import type { listCompanies, listUnits } from "@/lib/data/machines";

type CompanyOptions = Awaited<ReturnType<typeof listCompanies>>;
type UnitOptions = Awaited<ReturnType<typeof listUnits>>;

export function MachineForm({
  session,
  machine,
  companies,
  units,
}: {
  session: SessionUser;
  machine?: MachineView;
  companies: CompanyOptions;
  units: UnitOptions;
}) {
  const editing = Boolean(machine);
  const action = editing ? updateMachineAction : createMachineAction;

  return (
    <form className="panel record-form" action={action}>
      {machine && <input type="hidden" name="machineId" value={machine.id} />}
      {machine && <input type="hidden" name="description" value={machine.description} />}
      {machine ? (
        <label>Empresa<input value={machine.companyName} readOnly disabled /></label>
      ) : isSuperAdmin(session) && (
        <label>Empresa<select name="companyId" required defaultValue={companies[0]?.id ?? ""}>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
      )}
      <label>Unidade<select name="unitId" required defaultValue={machine?.unitId ?? units[0]?.id ?? ""}>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label>Equipamento<input name="name" required defaultValue={machine?.name ?? ""} placeholder="Inspetora Eletrônica EBI 01" /></label>
      <label>Código<input name="code" required defaultValue={machine?.code ?? ""} placeholder="EBI-01" /></label>
      <label>Número de série<input name="serial" required defaultValue={machine?.serial ?? ""} /></label>
      <label>Patrimônio/TAG<input name="tag" required defaultValue={machine?.tag ?? ""} /><input type="hidden" name="assetTag" value={machine?.assetTag && machine.assetTag !== machine.tag ? machine.assetTag : ""} /></label>
      <label>Tipo de máquina<input name="machineType" defaultValue={machine?.machineType ?? ""} placeholder="Inspeção de garrafas" /></label>
      <label>Fabricante<input name="manufacturer" required defaultValue={machine?.manufacturer ?? ""} /></label>
      <label>Modelo<input name="model" required defaultValue={machine?.model ?? ""} /></label>
      <label>Ano de fabricação<input name="year" type="text" required defaultValue={machine?.year ?? ""} /></label>
      <label>Setor<input name="sector" required defaultValue={machine?.sector ?? ""} /></label>
      <label>Área<input name="area" defaultValue={machine?.area ?? ""} /></label>
      <label>Capacidade<input name="capacity" defaultValue={machine?.capacity ?? ""} /></label>
      <label>Documento<input name="documentNumber" defaultValue={machine?.documentNumber ?? ""} placeholder="APR-001" /></label>
      <label>Revisão<input name="documentRevision" defaultValue={machine?.documentRevision ?? ""} placeholder="1.0" /></label>
      <label>Categoria<select name="category" defaultValue={machine?.category ?? "B"}><option value="B">B</option><option value="CAT_1">1</option><option value="CAT_2">2</option><option value="CAT_3">3</option><option value="CAT_4">4</option></select></label>
      <HrnFields current={machine?.hrn ?? ""} residual={machine?.hrnResidual} riskOrigin={machine?.riskOrigin} manualRiskLevel={machine?.manualRiskLevel} />
      <label>Status<select name="status" defaultValue={machine?.status === "Em manutenção" ? "EM_MANUTENCAO" : machine?.status === "Interditada" ? "INTERDITADA" : "OPERACIONAL"}><option value="OPERACIONAL">Operacional</option><option value="EM_MANUTENCAO">Em manutenção</option><option value="INTERDITADA">Interditada</option></select></label>
      <label className="full">Fontes de energia<input name="energySources" defaultValue={machine?.energy ?? "Elétrica"} placeholder="Elétrica, mecânica e pneumática" /></label>
      <label className="full">Principais sistemas e dispositivos<textarea name="mainSystems" rows={3} defaultValue={machine?.mainSystems ?? ""} /></label>
      <label className="full">Utilização do equipamento<textarea name="usage" rows={2} defaultValue={machine?.usage ?? ""} /></label>
      <label className="full">Características de processo<textarea name="processCharacteristics" rows={2} defaultValue={machine?.processCharacteristics ?? ""} /></label>
      <label>Operadores<input name="operatorCount" type="number" defaultValue={machine?.operatorCount ?? ""} /></label>
      <label className="full">Função dos operadores<textarea name="operatorSkills" rows={2} defaultValue={machine?.operatorSkills ?? ""} /></label>
      <label>Manutenção mecânica<input name="mechMaintenanceCount" type="number" defaultValue={machine?.mechMaintenanceCount ?? ""} /></label>
      <label className="full">Identificação de riscos - Mecânico<textarea name="mechMaintenanceSkills" rows={2} defaultValue={machine?.mechMaintenanceSkills ?? ""} /></label>
      <label>Manutenção elétrica<input name="elecMaintenanceCount" type="number" defaultValue={machine?.elecMaintenanceCount ?? ""} /></label>
      <label className="full">Identificação de riscos - Elétrico<textarea name="elecMaintenanceSkills" rows={2} defaultValue={machine?.elecMaintenanceSkills ?? ""} /></label>
      <label className="full">Observações<textarea name="observations" rows={3} defaultValue={machine?.observations ?? ""} /></label>
      <div className="form-actions"><button className="button primary" type="submit">{editing ? "Salvar alterações" : "Salvar máquina"}</button></div>
    </form>
  );
}
