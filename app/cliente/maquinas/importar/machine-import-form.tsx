"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { confirmMachineImportAction, previewMachineImportAction, type MachineImportPreviewResult } from "@/app/actions/machine-import";
import { machineImportFieldLabels, riskLabelFor, type MachineImportDraft } from "@/lib/import/machine-import-map";
import { riskTones } from "@/lib/labels";

type UnitOption = { id: string; name: string; companyId: string; companyName: string };
type CompanyOption = { id: string; name: string };

export function MachineImportForm({
  isSuperAdmin,
  companies,
  units,
  defaultCompanyId,
}: {
  isSuperAdmin: boolean;
  companies: CompanyOption[];
  units: UnitOption[];
  defaultCompanyId: string | null;
}) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [unitId, setUnitId] = useState(() => {
    const scoped = units.filter((unit) => !defaultCompanyId || unit.companyId === defaultCompanyId);
    return scoped[0]?.id ?? units[0]?.id ?? "";
  });
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<MachineImportPreviewResult | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const visibleUnits = useMemo(
    () => (isSuperAdmin ? units.filter((unit) => !companyId || unit.companyId === companyId) : units),
    [companyId, isSuperAdmin, units],
  );

  const selectedRows = useMemo(() => {
    if (!preview) return [];
    return preview.rows.filter((row) => selected[row.rowNumber] && !row.existsInCompany);
  }, [preview, selected]);

  const missingHrn = Boolean(preview?.rows.length && preview.rows.every((row) => !row.hrnCurrent));

  function onCompanyChange(value: string) {
    setCompanyId(value);
    const next = units.find((unit) => unit.companyId === value);
    setUnitId(next?.id ?? "");
    setPreview(null);
  }

  function toggleRow(row: MachineImportDraft, value: boolean) {
    if (row.existsInCompany) return;
    setSelected((current) => ({ ...current, [row.rowNumber]: value }));
  }

  function selectEligible(onlyNew: boolean) {
    if (!preview) return;
    const next: Record<number, boolean> = {};
    for (const row of preview.rows) {
      next[row.rowNumber] = row.existsInCompany ? false : onlyNew ? !row.duplicateInFile : true;
    }
    setSelected(next);
  }

  function analyze(formData: FormData) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await previewMachineImportAction(formData);
        const initial: Record<number, boolean> = {};
        for (const row of result.rows) {
          initial[row.rowNumber] = !row.existsInCompany && !row.duplicateInFile;
        }
        setPreview(result);
        setSelected(initial);
      } catch (caught) {
        setPreview(null);
        setError(caught instanceof Error ? caught.message : "Não foi possível ler a planilha.");
      }
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
    setPreview(null);
    setError("");
    if (!file || !event.currentTarget.form) return;
    analyze(new FormData(event.currentTarget.form));
  }

  function confirm() {
    if (!preview) return;
    setError("");
    setMessage("");
    const formData = new FormData();
    formData.set("companyId", companyId || preview.companyId);
    formData.set("unitId", unitId || preview.unitId);
    formData.set("machines", JSON.stringify(selectedRows));
    startTransition(async () => {
      try {
        const result = await confirmMachineImportAction(formData);
        setMessage(`${result.created} máquina(s) cadastrada(s)${result.skipped ? ` · ${result.skipped} ignorada(s)` : ""}.`);
        router.push("/cliente/maquinas");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Não foi possível salvar as máquinas.");
      }
    });
  }

  return (
    <div className="import-stack">
      <form className="panel record-form" action={analyze} onChange={() => setError("")}>
        {isSuperAdmin && (
          <label>
            Empresa
            <select name="companyId" required value={companyId} onChange={(event) => onCompanyChange(event.target.value)}>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </label>
        )}
        {!isSuperAdmin && <input type="hidden" name="companyId" value={companyId} />}
        <label>
          Unidade
          <select name="unitId" required value={unitId} onChange={(event) => setUnitId(event.target.value)} disabled={!visibleUnits.length}>
            {!visibleUnits.length && <option value="">Cadastre uma unidade antes de importar</option>}
            {visibleUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>{isSuperAdmin ? `${unit.companyName} · ${unit.name}` : unit.name}</option>
            ))}
          </select>
        </label>
        <label className="full file-field">
          Planilha NR-12
          <input
            name="file"
            type="file"
            required
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileChange}
          />
          <small>Arquivo .xlsx da relação de máquinas (até 40 MB). Ao escolher o arquivo, a revisão aparece abaixo. Fotos embutidas não são importadas nesta etapa.</small>
        </label>
        <div className="form-actions">
          <button className="button secondary" type="submit" disabled={pending || !visibleUnits.length}>
            <FileSpreadsheet size={16} /> {pending && !preview ? "Analisando..." : preview ? "Analisar novamente" : "Analisar planilha"}
          </button>
        </div>
      </form>

      {error && <p className="import-alert error" role="alert">{error}</p>}
      {message && <p className="import-alert success">{message}</p>}

      {preview && (
        <section className="panel import-review">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Revisão</span>
              <h2>{fileName || preview.sheetName}</h2>
              <p>{preview.rows.length} linhas lidas · {selectedRows.length} selecionadas para cadastro</p>
            </div>
          </div>

          <div className="import-summary-grid">
            <article><strong>{preview.rows.length}</strong><span>na planilha</span></article>
            <article><strong>{preview.rows.filter((row) => !row.existsInCompany && !row.duplicateInFile).length}</strong><span>novas</span></article>
            <article><strong>{preview.rows.filter((row) => row.existsInCompany).length}</strong><span>já cadastradas</span></article>
            <article><strong>{preview.rows.filter((row) => row.duplicateInFile).length}</strong><span>código repetido</span></article>
          </div>

          <div className="import-map">
            <strong>Como os campos serão gravados</strong>
            <ul>
              {preview.mappedColumns.map((column) => (
                <li key={`${column.header}-${column.field}`}>
                  <span>{column.header}</span>
                  <small>{machineImportFieldLabels[column.field as keyof typeof machineImportFieldLabels] ?? column.field}</small>
                </li>
              ))}
            </ul>
            <p>TAG e série saem do código MQ no nome, quando existir. Status fica operacional e fontes de energia como “Não informado”. Fotos da máquina e do painel elétrico ficam de fora desta importação.</p>
            {missingHrn && <p>A coluna Cálculo HRN está vazia nesta planilha; o HRN será gravado como 0 até uma APR posterior.</p>}
            {preview.skippedRows.length > 0 && (
              <p>{preview.skippedRows.length} linha(s) ignorada(s) por não terem código nem nome: {preview.skippedRows.map((row) => row.rowNumber).join(", ")}.</p>
            )}
          </div>

          <div className="import-review-toolbar">
            <button className="button secondary" type="button" onClick={() => selectEligible(true)}>Selecionar só as novas</button>
            <button className="button secondary" type="button" onClick={() => selectEligible(false)}>Selecionar todas</button>
            <span>{selectedRows.length} prontas para gravar</span>
          </div>

          <div className="responsive-table">
            <table className="import-review-table">
              <thead>
                <tr>
                  <th>Incluir</th>
                  <th>Código</th>
                  <th>Equipamento</th>
                  <th>Tipo / setor</th>
                  <th>Fabricante</th>
                  <th>Risco</th>
                  <th>Avisos</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => {
                  const blocked = row.existsInCompany;
                  return (
                    <tr key={row.rowNumber} className={blocked ? "import-row-skip" : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(selected[row.rowNumber])}
                          disabled={blocked}
                          onChange={(event) => toggleRow(row, event.target.checked)}
                          aria-label={`Incluir ${row.code}`}
                        />
                      </td>
                      <td>
                        <strong>{row.code}</strong>
                        <small>Linha {row.rowNumber} · TAG {row.tag}</small>
                      </td>
                      <td>
                        <strong title={row.description}>{row.name}</strong>
                        <small>{row.capacity ?? "Capacidade não informada"}{row.year ? ` · ${row.year}` : ""}</small>
                      </td>
                      <td>
                        <strong>{row.machineType ?? "—"}</strong>
                        <small>{row.sector} · {row.area}</small>
                      </td>
                      <td>
                        <strong>{row.manufacturer}</strong>
                        <small>{row.model}</small>
                      </td>
                      <td>
                        <span className={`badge ${riskTones[row.riskLevel]}`}><span />{riskLabelFor(row.riskLevel)}{row.hrnCurrent ? ` · HRN ${row.hrnCurrent}` : ""}</span>
                      </td>
                      <td>
                        {row.warnings.length ? (
                          <span className="import-row-warning" title={row.warnings.join(" ")}>
                            <AlertTriangle size={14} /> {row.warnings[0]}{row.warnings.length > 1 ? ` +${row.warnings.length - 1}` : ""}
                          </span>
                        ) : (
                          <span className="import-row-ok"><CheckCircle2 size={14} /> Pronto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="form-actions import-confirm-actions">
            <button className="button primary" type="button" disabled={pending || selectedRows.length === 0} onClick={confirm}>
              <Upload size={16} /> {pending ? "Salvando..." : `Confirmar cadastro (${selectedRows.length})`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
