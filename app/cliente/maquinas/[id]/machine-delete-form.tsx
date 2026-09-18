"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteMachineAction } from "@/app/actions/records";

export function MachineDeleteForm({ machine }: { machine: {
  id: string;
  name: string;
  code: string;
  documents: number;
  riskAssessments: number;
  checklists: number;
  actionPlans: number;
  activities: number;
  photos: number;
} }) {
  const linkedItems = [
    [machine.documents, "documentos"],
    [machine.riskAssessments, "avaliações de risco"],
    [machine.checklists, "checklists"],
    [machine.actionPlans, "planos de ação"],
    [machine.activities, "atividades"],
    [machine.photos, "fotos"],
  ] as const;
  const linkedSummary = linkedItems.filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`).join(", ");
  const warning = `Excluir ${machine.name} (${machine.code}) permanentemente?${linkedSummary ? `\n\nTambém serão removidos: ${linkedSummary}.` : ""}\n\nEsta ação não pode ser desfeita.`;

  return (
    <form action={deleteMachineAction} onSubmit={(event) => {
      if (!window.confirm(warning)) event.preventDefault();
    }}>
      <input type="hidden" name="machineId" value={machine.id} />
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className="button danger" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}{pending ? "Excluindo..." : "Excluir máquina"}</button>;
}
