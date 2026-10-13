"use client";

import { createDocumentAction, prepareDocumentUploadAction } from "@/app/actions/safe-records";
import { SafeForm } from "@/app/components/safe-form";
import { describeError, isActionFailure, type ActionFailure, type FormActionResult } from "@/lib/friendly-errors";
import { unstable_rethrow } from "next/navigation";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

type MachineOption = {
  id: string;
  code: string;
  name: string;
};

export function DocumentCreateForm({
  machines,
  defaultMachineId,
  responsible,
}: {
  machines: MachineOption[];
  defaultMachineId?: string;
  responsible: string;
}) {
  async function submit(data: FormData): Promise<FormActionResult> {
    const value = data.get("file");
    const file = value instanceof File && value.size > 0 ? value : null;
    if (!file) return createDocumentAction(data);
    if (file.size > MAX_UPLOAD_BYTES) return uploadFailure("O anexo deve ter no máximo 20 MB.");

    try {
      const preparationData = new FormData();
      preparationData.set("machineId", String(data.get("machineId") ?? ""));
      preparationData.set("fileName", file.name);
      preparationData.set("contentType", file.type);
      preparationData.set("sizeBytes", String(file.size));
      const preparation = await prepareDocumentUploadAction(preparationData);
      if (isActionFailure(preparation)) return preparation;
      if (preparation.mode === "server") return createDocumentAction(data);

      const uploadBody = new FormData();
      Object.entries(preparation.upload.fields).forEach(([key, fieldValue]) => uploadBody.set(key, fieldValue));
      uploadBody.set("file", file, file.name);
      const response = await fetch(preparation.upload.url, { method: "POST", body: uploadBody });
      if (!response.ok) {
        return uploadFailure("O armazenamento recusou o arquivo antes da conclusão do cadastro.");
      }

      data.delete("file");
      data.set("uploadToken", preparation.token);
      return createDocumentAction(data);
    } catch (cause) {
      unstable_rethrow(cause);
      return { ok: false, error: describeError(cause) };
    }
  }

  return (
    <SafeForm className="panel record-form" action={submit}>
      <label className="full">Máquina<select name="machineId" required defaultValue={defaultMachineId}>{machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.code} · {machine.name}</option>)}</select></label>
      <label className="full">Nome<input name="name" required /></label>
      <label>Tipo<select name="type"><option value="APRECIACAO_RISCO">Apreciação de risco</option><option value="APR">APR</option><option value="CHECKLIST_SEGURANCA">Checklist de segurança</option><option value="CHECKLIST_MANUTENCAO">Checklist de manutenção</option><option value="MANUAL">Manual</option><option value="LAUDO">Laudo</option><option value="ART">ART</option><option value="OUTRO">Outro</option></select></label>
      <label>Versão<input name="version" defaultValue="1.0" /></label>
      <label>Emissão<input name="issueDate" type="date" required /></label>
      <label>Validade<input name="expirationDate" type="date" /></label>
      <label>Responsável<input name="responsible" defaultValue={responsible} /></label>
      <label className="full">Descrição<textarea name="description" rows={3} /></label>
      <label className="full file-field">Anexo<input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp" /><small>PDF, imagem, Word ou Excel até 20 MB. O arquivo fica restrito à empresa da sessão.</small></label>
      <div className="form-actions"><button className="button primary" type="submit">Salvar documento</button></div>
    </SafeForm>
  );
}

function uploadFailure(message: string): ActionFailure {
  return {
    ok: false,
    error: {
      code: "ENVIO_ARQUIVO",
      title: "Não foi possível enviar o arquivo",
      message,
      nextStep: "Selecione o arquivo novamente e tente concluir o cadastro.",
    },
  };
}
