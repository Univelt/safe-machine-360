"use client";

import { MoreVertical, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  setChecklistTemplateActiveAction,
  updateChecklistTemplateAction,
  type ChecklistMutationState,
} from "@/app/actions/records";

const initialState: ChecklistMutationState = { ok: false, message: "" };

export function ChecklistTemplateManagement({
  template,
  canEdit,
}: {
  template: { id: string; name: string; description: string | null; isActive: boolean; executions: number };
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editingPending] = useActionState(updateChecklistTemplateAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(setChecklistTemplateActiveAction, initialState);

  useEffect(() => {
    if (editState.ok) {
      router.refresh();
    }
  }, [editState.ok, router]);

  useEffect(() => {
    if (statusState.ok) {
      router.push("/cliente/checklists");
      router.refresh();
    }
  }, [statusState.ok, router]);

  if (!canEdit) return null;

  return (
    <div className="record-management">
      <button className="button secondary" type="button" onClick={() => setEditing((value) => !value)}>
        {editing ? <X size={16} /> : <Pencil size={16} />} {editing ? "Cancelar edição" : "Editar modelo"}
      </button>
      <details className="actions-menu">
        <summary className="icon-button" aria-label="Mais ações do checklist"><MoreVertical size={18} /></summary>
        <div>
          <form action={statusAction} onSubmit={(event) => {
            if (!template.isActive) return;
            const impact = template.executions > 0
              ? `Este modelo tem ${template.executions} preenchimento(s). Ele será desativado e o histórico será preservado.`
              : "O modelo será excluído se não possuir histórico; caso contrário, será desativado.";
            if (!window.confirm(`${impact}\n\nDeseja continuar?`)) event.preventDefault();
          }}>
            <input type="hidden" name="templateId" value={template.id} />
            <input type="hidden" name="intent" value={template.isActive ? "remove" : "restore"} />
            <button type="submit" disabled={statusPending} className={template.isActive ? "danger-action" : undefined}>
              {template.isActive ? <Trash2 size={15} /> : <RotateCcw size={15} />}
              {statusPending ? "Processando..." : template.isActive ? "Excluir ou desativar" : "Reativar modelo"}
            </button>
          </form>
        </div>
      </details>
      {editing && (
        <form action={editAction} className="inline-edit-form">
          <input type="hidden" name="templateId" value={template.id} />
          <label>Nome<input name="name" required defaultValue={template.name} /></label>
          <label>Descrição<textarea name="description" rows={3} defaultValue={template.description ?? ""} /></label>
          <button className="button primary" type="submit" disabled={editingPending}>{editingPending ? "Salvando..." : "Salvar alterações"}</button>
        </form>
      )}
      {(editState.message || statusState.message) && <p className={`form-feedback ${(editState.ok || statusState.ok) ? "success" : "error"}`} role="status">{editState.message || statusState.message}</p>}
    </div>
  );
}
