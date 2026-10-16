"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useId, useRef } from "react";
import { SafeForm, useSafeFormStatus } from "@/app/components/safe-form";
import { deleteDocumentAction } from "@/app/actions/safe-records";

export function DocumentDeleteForm({ document }: { document: { id: string; name: string; machine: string; machineCode: string; hasFile: boolean } }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  return <>
    <button className="button danger" type="button" onClick={() => dialog.current?.showModal()}><Trash2 size={16} />Excluir documento</button>
    <dialog className="document-delete-dialog" ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => {
      if (event.currentTarget.querySelector('form[aria-busy="true"]')) event.preventDefault();
    }}>
      <h2 id={titleId}>Excluir documento?</h2>
      <div id={descriptionId}>
        <p>Você está prestes a excluir <strong>{document.name}</strong>.</p>
        <p className="document-delete-machine">Máquina: {document.machineCode} · {document.machine}</p>
        {document.hasFile && <p>O arquivo anexado também será removido.</p>}
        <p>A máquina e os demais documentos serão mantidos. <strong>Esta ação não pode ser desfeita.</strong></p>
      </div>
      <SafeForm className="document-delete-form" action={deleteDocumentAction}>
        <input type="hidden" name="documentId" value={document.id} />
        <DeleteButtons onCancel={() => dialog.current?.close()} />
      </SafeForm>
    </dialog>
  </>;
}

function DeleteButtons({ onCancel }: { onCancel: () => void }) {
  const { pending } = useSafeFormStatus();
  return <div className="document-delete-dialog-actions">
    <button className="button secondary" type="button" disabled={pending} onClick={onCancel}>Cancelar</button>
    <button className="button danger" type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
      {pending ? "Excluindo..." : "Excluir permanentemente"}
    </button>
  </div>;
}
