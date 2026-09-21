"use client";

import { CheckCircle2, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { createActivityAction } from "@/app/actions/records";

type MachineOption = {
  id: string;
  name: string;
  code: string;
  tag: string;
  companyName: string;
};

type RequiredField = "machineId" | "title" | "responsible" | "dueDate" | "description";

export function ActivityForm({ machines, initialMachineId, defaultResponsible }: { machines: MachineOption[]; initialMachineId?: string; defaultResponsible: string }) {
  const initialMachine = machines.find((machine) => machine.id === initialMachineId) ?? null;
  const [machineId, setMachineId] = useState(initialMachine?.id ?? "");
  const [machineQuery, setMachineQuery] = useState(initialMachine ? machineLabel(initialMachine) : "");
  const [machineOpen, setMachineOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [responsible, setResponsible] = useState(defaultResponsible);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const selectedMachine = machines.find((machine) => machine.id === machineId) ?? null;
  const normalized = machineQuery.trim().toLocaleLowerCase("pt-BR");
  const filtered = useMemo(() => machines.filter((machine) => [machine.name, machine.code, machine.tag, machine.companyName]
    .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized))).slice(0, 12), [machines, normalized]);

  function selectMachine(machine: MachineOption | null) {
    setMachineId(machine?.id ?? "");
    setMachineQuery(machine ? machineLabel(machine) : "");
    setMachineOpen(false);
    setErrors((current) => ({ ...current, machineId: undefined }));
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const next: Partial<Record<RequiredField, string>> = {};
    if (!machineId) next.machineId = "Selecione uma máquina.";
    if (!title.trim()) next.title = "Informe o título da atividade.";
    if (!responsible.trim()) next.responsible = "Informe o responsável.";
    if (!dueDate) next.dueDate = "Informe a data prevista.";
    if (!description.trim()) next.description = "Descreva a atividade.";
    setErrors(next);
    const first = Object.keys(next)[0] as RequiredField | undefined;
    if (first) {
      event.preventDefault();
      const target = formRef.current?.elements.namedItem(first);
      if (target instanceof HTMLElement) target.focus();
    }
  }

  return (
    <form ref={formRef} className="panel record-form activity-create-form" action={createActivityAction} onSubmit={validate} noValidate>
      <div className="full form-field">
        <label htmlFor="machine-search"><span>Máquina <span className="required-mark" aria-hidden="true">*</span></span></label>
        <input type="hidden" name="machineId" value={machineId} />
        <div className={`combobox ${errors.machineId ? "field-invalid" : ""}`}>
          <Search size={17} aria-hidden="true" />
          <input
            id="machine-search"
            name="machineSearch"
            role="combobox"
            aria-expanded={machineOpen}
            aria-controls="machine-options"
            aria-autocomplete="list"
            aria-describedby={errors.machineId ? "machine-error" : "machine-help"}
            placeholder="Buscar por código, TAG, nome ou empresa"
            value={machineQuery}
            onFocus={() => setMachineOpen(true)}
            onChange={(event) => {
              setMachineQuery(event.target.value);
              setMachineId("");
              setMachineOpen(true);
            }}
          />
          {machineQuery ? <button type="button" onClick={() => selectMachine(null)} aria-label="Limpar máquina"><X size={16} /></button> : <ChevronDown size={16} aria-hidden="true" />}
          {machineOpen && (
            <div id="machine-options" className="combobox-options" role="listbox">
              <button type="button" className="combobox-none" onClick={() => selectMachine(null)}>Nenhuma máquina selecionada</button>
              {filtered.map((machine) => (
                <button key={machine.id} type="button" role="option" aria-selected={machine.id === machineId} onClick={() => selectMachine(machine)}>
                  <span><strong>{machine.code} · {machine.name}</strong><small>{machine.tag || "Sem TAG"} · {machine.companyName}</small></span>
                  {machine.id === machineId && <CheckCircle2 size={16} />}
                </button>
              ))}
              {filtered.length === 0 && <p>Nenhuma máquina encontrada.</p>}
            </div>
          )}
        </div>
        <small id="machine-help">A lista não seleciona uma máquina automaticamente.</small>
        {errors.machineId && <small id="machine-error" className="field-error" role="alert">{errors.machineId}</small>}
      </div>

      <label className={`full ${errors.title ? "field-invalid" : ""}`}><span>Título <span className="required-mark" aria-hidden="true">*</span></span><input name="title" value={title} onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: undefined })); }} aria-invalid={Boolean(errors.title)} />{errors.title && <small className="field-error">{errors.title}</small>}</label>
      <label>Tipo<input name="type" defaultValue="Ação corretiva" /></label>
      <label>Prioridade<select name="priority"><option value="MEDIA">Média</option><option value="BAIXA">Baixa</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></select></label>
      <label>Status<select name="status"><option value="ABERTA">Aberta</option><option value="EM_ANDAMENTO">Em andamento</option><option value="CONCLUIDA">Concluída</option><option value="ATRASADA">Atrasada</option></select></label>
      <label className={errors.responsible ? "field-invalid" : ""}><span>Responsável <span className="required-mark" aria-hidden="true">*</span></span><input name="responsible" value={responsible} onChange={(event) => { setResponsible(event.target.value); setErrors((current) => ({ ...current, responsible: undefined })); }} aria-invalid={Boolean(errors.responsible)} />{errors.responsible && <small className="field-error">{errors.responsible}</small>}</label>
      <label>E-mail do responsável<input name="responsibleEmail" type="email" /></label>
      <label className={errors.dueDate ? "field-invalid" : ""}><span>Data prevista <span className="required-mark" aria-hidden="true">*</span></span><input name="dueDate" type="date" value={dueDate} onChange={(event) => { setDueDate(event.target.value); setErrors((current) => ({ ...current, dueDate: undefined })); }} aria-invalid={Boolean(errors.dueDate)} />{errors.dueDate && <small className="field-error">{errors.dueDate}</small>}</label>
      <label>Data executada<input name="executedAt" type="date" /></label>
      <label>Progresso inicial (%)<input name="progress" type="number" min="0" max="100" defaultValue={0} /></label>
      <label className={`full ${errors.description ? "field-invalid" : ""}`}><span>Descrição <span className="required-mark" aria-hidden="true">*</span></span><textarea name="description" rows={4} value={description} onChange={(event) => { setDescription(event.target.value); setErrors((current) => ({ ...current, description: undefined })); }} aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}</label>
      <label className="full file-field">Evidência<input name="file" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp" /><small>PDF, imagem, Word ou Excel até 20 MB. Depois você pode anexar mais na ficha da atividade.</small></label>

      <aside className="full form-summary" aria-label="Resumo da atividade">
        <span className="eyebrow">Revise antes de salvar</span>
        <dl>
          <div><dt>Máquina</dt><dd>{selectedMachine ? `${selectedMachine.code} · ${selectedMachine.name}` : "Não selecionada"}</dd></div>
          <div><dt>Atividade</dt><dd>{title.trim() || "Sem título"}</dd></div>
          <div><dt>Responsável</dt><dd>{responsible.trim() || "Não informado"}</dd></div>
          <div><dt>Prazo</dt><dd>{dueDate ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${dueDate}T00:00:00Z`)) : "Não informado"}</dd></div>
        </dl>
      </aside>
      <div className="form-actions"><button className="button primary" type="submit">Salvar atividade</button></div>
    </form>
  );
}

function machineLabel(machine: MachineOption) {
  return `${machine.code} · ${machine.name}`;
}
