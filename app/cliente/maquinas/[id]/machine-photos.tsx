"use client";

import { Check, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { deleteMachinePhotoAction, uploadMachinePhotoAction } from "@/app/actions/records";
import { ChangeLog } from "../../../components/change-log";
import type { MachineView } from "@/lib/data/types";
import { formatDate } from "@/lib/labels";

function todayInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function MachinePhotos({ machine, canMutate }: { machine: MachineView; canMutate: boolean }) {
  const photos = machine.photos.filter((photo) => photo.url);
  return (
    <section className="panel detail-section" id="fotos">
      <div className="panel-header">
        <div><span className="panel-kicker">Registro visual</span><h2>Fotos cadastradas</h2></div>
        {canMutate && <AddPhotoModal machineId={machine.id} />}
      </div>
      <div className="machine-section-body photo-gallery">
        {photos.map((photo) => (
          <article key={photo.id} className={`photo-preview ${photo.compliant ? "is-ok" : "is-fail"}`}>
            <header className="photo-preview-head">
              <strong>{photo.caption}</strong>
              <small>{formatDate(photo.takenAt)}</small>
            </header>
            <div className="photo-preview-media">
              <Image src={photo.url ?? ""} alt={`${photo.caption} da máquina ${machine.name}, código ${machine.code}`} width={520} height={320} unoptimized />
              <span className={`photo-norm-badge ${photo.compliant ? "ok" : "fail"}`} title={photo.compliant ? "Dentro da norma" : "Fora da norma"}>
                {photo.compliant ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                <span className="sr-only">{photo.compliant ? "Dentro da norma" : "Fora da norma"}</span>
              </span>
            </div>
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
        {photos.length === 0 && <p className="empty-copy">Nenhuma foto cadastrada ainda.</p>}
      </div>
      <ChangeLog at={machine.lastPhotoChange?.at} by={machine.lastPhotoChange?.by} />
    </section>
  );
}

function AddPhotoModal({ machineId }: { machineId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button className="text-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        Adicionar foto <Plus size={16} />
      </button>
      <dialog
        ref={dialogRef}
        className="photo-modal"
        aria-labelledby="photo-modal-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="photo-modal-card">
          <header className="photo-modal-head">
            <div>
              <span className="panel-kicker">Registro visual</span>
              <h3 id="photo-modal-title">Adicionar foto</h3>
            </div>
            <button className="icon-button" type="button" onClick={close} aria-label="Fechar">
              <X size={18} />
            </button>
          </header>
          <form className="photo-modal-form" action={uploadMachinePhotoAction}>
            <input type="hidden" name="machineId" value={machineId} />
            <label>Nome da foto<input name="caption" type="text" required placeholder="Foto frontal" autoFocus /></label>
            <label>Data<input name="takenAt" type="date" required defaultValue={todayInputValue()} /></label>
            <label className="file-field">Arquivo<input name="file" type="file" required accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" /></label>
            <label className="checkbox-row">
              <input name="compliant" type="checkbox" value="true" />
              Dentro da norma
            </label>
            <div className="photo-modal-actions">
              <button className="button secondary" type="button" onClick={close}>Cancelar</button>
              <SavePhotoButton />
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

function SavePhotoButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}
      <span>{pending ? "Enviando..." : "Salvar foto"}</span>
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
