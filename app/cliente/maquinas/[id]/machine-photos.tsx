"use client";

import { LoaderCircle, Plus, X } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { deleteMachinePhotoAction, uploadMachinePhotoAction } from "@/app/actions/records";
import type { MachineView } from "@/lib/data/types";

export function MachinePhotos({ machine, canMutate }: { machine: MachineView; canMutate: boolean }) {
  const photos = machine.photos.filter((photo) => photo.url);
  return (
    <section className="panel detail-section" id="fotos">
      <div className="panel-header"><div><span className="panel-kicker">Registro visual</span><h2>Fotos cadastradas</h2></div></div>
      <div className="machine-section-body photo-gallery">
        {photos.map((photo) => (
          <article key={photo.id} className="photo-preview">
            <img src={photo.url ?? undefined} alt={photo.caption} />
            {canMutate && (
              <form action={deleteMachinePhotoAction}>
                <input type="hidden" name="machineId" value={machine.id} />
                <input type="hidden" name="photoId" value={photo.id} />
                <RemovePhotoButton />
              </form>
            )}
          </article>
        ))}
        {canMutate && <AddPhotoTile machineId={machine.id} />}
        {!canMutate && photos.length === 0 && <p className="empty-copy">Nenhuma foto cadastrada ainda.</p>}
      </div>
    </section>
  );
}

function AddPhotoTile({ machineId }: { machineId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form className="photo-add" action={uploadMachinePhotoAction}>
      <input type="hidden" name="machineId" value={machineId} />
      <input
        ref={inputRef}
        className="sr-only"
        name="file"
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        multiple
        onChange={(event) => {
          if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
        }}
      />
      <AddPhotoButton onPick={() => inputRef.current?.click()} />
    </form>
  );
}

function AddPhotoButton({ onPick }: { onPick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="button" disabled={pending} onClick={onPick} aria-label="Adicionar foto">
      {pending ? <LoaderCircle className="spin" size={22} /> : <Plus size={22} />}
      <span>{pending ? "Enviando..." : "Adicionar foto"}</span>
    </button>
  );
}

function RemovePhotoButton() {
  const { pending } = useFormStatus();
  return (
    <button className="photo-remove" type="submit" disabled={pending} aria-label="Remover foto">
      {pending ? <LoaderCircle className="spin" size={14} /> : <X size={14} />}
    </button>
  );
}
