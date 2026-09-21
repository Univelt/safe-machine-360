"use client";

import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { deleteMachinePhotoAction, uploadMachinePhotoAction } from "@/app/actions/records";
import type { MachineView } from "@/lib/data/types";
import { photoKindLabels } from "@/lib/labels";

export function MachinePhotos({ machine, canMutate }: { machine: MachineView; canMutate: boolean }) {
  const photos = machine.photos.filter((photo) => photo.url);
  return (
    <section className="panel detail-section" id="fotos">
      <div className="panel-header"><div><span className="panel-kicker">Registro visual</span><h2>Fotos cadastradas</h2></div></div>
      <div className="machine-section-body photo-gallery">
        {photos.map((photo) => (
          <article key={photo.id} className="photo-preview">
            <Image src={photo.url ?? ""} alt={`${photoKindLabels[photo.kind]} da máquina ${machine.name}, código ${machine.code}`} width={520} height={320} unoptimized />
            {canMutate && (
              <form action={deleteMachinePhotoAction} onSubmit={(event) => {
                if (!window.confirm(`Remover esta foto de ${machine.name}? Esta ação não pode ser desfeita.`)) event.preventDefault();
              }}>
                <input type="hidden" name="machineId" value={machine.id} />
                <input type="hidden" name="photoId" value={photo.id} />
                <RemovePhotoButton machineName={machine.name} />
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

function RemovePhotoButton({ machineName }: { machineName: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="photo-remove" type="submit" disabled={pending} aria-label={`Remover foto de ${machineName}`}>
      {pending ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}
      <span>{pending ? "Removendo" : "Remover"}</span>
    </button>
  );
}
