"use client";

import { updateDocumentAction } from "@/app/actions/safe-records";
import { SafeForm } from "@/app/components/safe-form";
import { documentKindOptions } from "@/lib/labels";

type MachineOption = {
  id: string;
  code: string;
  name: string;
};

type EditableDocument = {
  id: string;
  name: string;
  typeKey: string;
  machineId: string;
  version: string;
  issueDateInput: string;
  expirationDateInput: string;
  responsible: string;
  description: string;
  hasFile: boolean;
  format: string;
  size: string;
};

export function DocumentEditForm({
  document,
  machines,
}: {
  document: EditableDocument;
  machines: MachineOption[];
}) {
  return (
    <SafeForm className="panel record-form" action={updateDocumentAction}>
      <input type="hidden" name="documentId" value={document.id} />
      <p className="full document-edit-note">{document.hasFile
        ? `O arquivo anexado (${document.format} · ${document.size}) permanece vinculado. Esta edição altera os dados do cadastro.`
        : "Este registro ainda não tem arquivo anexado. Esta edição altera os dados do cadastro."}</p>
      <label className="full">Máquina<select name="machineId" required defaultValue={document.machineId}>{machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.code} · {machine.name}</option>)}</select></label>
      <label className="full">Nome<input name="name" required defaultValue={document.name} /></label>
      <label>Tipo<select name="type" defaultValue={document.typeKey}>{documentKindOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label>Versão<input name="version" defaultValue={document.version} /></label>
      <label>Emissão<input name="issueDate" type="date" required defaultValue={document.issueDateInput} /></label>
      <label>Validade<input name="expirationDate" type="date" defaultValue={document.expirationDateInput} /></label>
      <label>Responsável<input name="responsible" defaultValue={document.responsible} /></label>
      <label className="full">Descrição<textarea name="description" rows={3} defaultValue={document.description} /></label>
      <div className="form-actions"><button className="button primary" type="submit">Salvar alterações</button></div>
    </SafeForm>
  );
}
