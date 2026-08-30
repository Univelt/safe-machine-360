"use client";

import { Download, FileText, ImageIcon, LoaderCircle, Plus, X } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { deleteActivityEvidenceAction, uploadActivityEvidenceAction } from "@/app/actions/records";
import type { ActivityView } from "@/lib/data/types";

export function ActivityEvidence({ activity, canMutate }: { activity: ActivityView; canMutate: boolean }) {
  return (
    <section className="panel detail-section">
      <div className="panel-header"><div><span className="panel-kicker">Evidências</span><h2>Arquivos e registros</h2></div><span className="nav-count activity-evidence-count">{activity.evidenceCount}</span></div>
      <div className="evidence-gallery">
        {activity.attachments.map((attachment) => (
          <article key={attachment.id} className={attachment.kind === "PHOTO" && attachment.url ? "has-preview" : undefined}>
            {attachment.kind === "PHOTO" && attachment.url ? (
              <a href={attachment.url} target="_blank" rel="noreferrer"><img src={attachment.url} alt={attachment.name} /></a>
            ) : (
              <div className="evidence-file">
                {attachment.kind === "PHOTO" ? <ImageIcon size={20} /> : <FileText size={20} />}
                <strong>{attachment.name}</strong>
                {attachment.url ? <a href={`${attachment.url}?download=1`}>Baixar</a> : <small>Somente registro</small>}
              </div>
            )}
            {attachment.url && attachment.kind === "PHOTO" ? (
              <a className="evidence-download" href={`${attachment.url}?download=1`} aria-label={`Baixar ${attachment.name}`}><Download size={14} /></a>
            ) : null}
            {canMutate && (
              <form action={deleteActivityEvidenceAction}>
                <input type="hidden" name="activityId" value={activity.id} />
                <input type="hidden" name="attachmentId" value={attachment.id} />
                <RemoveEvidenceButton />
              </form>
            )}
          </article>
        ))}
        {canMutate && <AddEvidenceTile activityId={activity.id} />}
        {!canMutate && activity.attachments.length === 0 && <p className="empty-copy">Nenhuma evidência anexada.</p>}
      </div>
    </section>
  );
}

function AddEvidenceTile({ activityId }: { activityId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form className="evidence-add" action={uploadActivityEvidenceAction}>
      <input type="hidden" name="activityId" value={activityId} />
      <input
        ref={inputRef}
        className="sr-only"
        name="file"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp"
        multiple
        onChange={(event) => {
          if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
        }}
      />
      <AddEvidenceButton onPick={() => inputRef.current?.click()} />
    </form>
  );
}

function AddEvidenceButton({ onPick }: { onPick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="button" disabled={pending} onClick={onPick} aria-label="Anexar evidência">
      {pending ? <LoaderCircle className="spin" size={22} /> : <Plus size={22} />}
      <span>{pending ? "Enviando..." : "Anexar evidência"}</span>
    </button>
  );
}

function RemoveEvidenceButton() {
  const { pending } = useFormStatus();
  return (
    <button className="photo-remove" type="submit" disabled={pending} aria-label="Remover evidência">
      {pending ? <LoaderCircle className="spin" size={14} /> : <X size={14} />}
    </button>
  );
}
