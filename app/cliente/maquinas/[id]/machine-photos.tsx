"use client";

import { SafeForm } from "@/app/components/safe-form";
import { Check, Expand, LoaderCircle, Pencil, Plus, Save, ShieldAlert, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { useSafeFormStatus } from "@/app/components/safe-form";
import { deleteMachinePhotoAction, updateMachinePhotoAction, uploadMachinePhotoAction } from "@/app/actions/safe-records";
import { ChangeLog } from "../../../components/change-log";
import type { MachineView } from "@/lib/data/types";
import { formatDate } from "@/lib/labels";

function todayInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function dateInputValue(value: string) {
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0] ?? todayInputValue();
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
        {photos.map((photo, index) => (
          <article key={photo.id} className={`photo-preview ${photo.compliant ? "is-ok" : "is-fail"}`}>
            <header className="photo-preview-head">
              <strong>{photo.caption}</strong>
              <small>{formatDate(photo.takenAt)}</small>
            </header>
            <PhotoLightbox photo={photo} machine={machine} index={index} />
            {canMutate && (
              <div className="photo-card-actions">
                <EditPhotoModal machineId={machine.id} photo={photo} />
                <SafeForm action={deleteMachinePhotoAction} onSubmit={(event) => {
                  if (!window.confirm(`Remover esta foto de ${machine.name}? Esta ação não pode ser desfeita.`)) event.preventDefault();
                }}>
                  <input type="hidden" name="machineId" value={machine.id} />
                  <input type="hidden" name="photoId" value={photo.id} />
                  <RemovePhotoButton machineName={machine.name} />
                </SafeForm>
              </div>
            )}
          </article>
        ))}
        {photos.length === 0 && <p className="empty-copy">Nenhuma foto cadastrada ainda.</p>}
      </div>
      <ChangeLog at={machine.lastPhotoChange?.at} by={machine.lastPhotoChange?.by} />
    </section>
  );
}

function PhotoLightbox({ photo, machine, index }: { photo: MachineView["photos"][number]; machine: MachineView; index: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `photo-preview-${photo.id}`;
  const close = () => dialogRef.current?.close();
  const alt = `Vista da máquina ${machine.name}, código ${machine.code} — foto ${index + 1}`;

  return (
    <>
      <div className="photo-preview-media">
        <button type="button" className="photo-expand" onClick={() => dialogRef.current?.showModal()} aria-label={`Ampliar foto ${photo.caption}`} aria-haspopup="dialog">
          <Image src={photo.url ?? ""} alt={alt} width={520} height={320} unoptimized />
          <span className="photo-expand-hint"><Expand size={15} /> Ampliar</span>
        </button>
        <span className={`photo-norm-badge ${photo.compliant ? "ok" : "fail"}`} title={photo.compliant ? "Dentro da norma" : "Fora da norma"}>
          {photo.compliant ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
          <span className="sr-only">{photo.compliant ? "Dentro da norma" : "Fora da norma"}</span>
        </span>
      </div>
      <dialog ref={dialogRef} className="photo-lightbox" aria-labelledby={titleId} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div className="photo-lightbox-card">
          <header className="photo-lightbox-head">
            <div><span className="panel-kicker">{machine.code}</span><h3 id={titleId}>{photo.caption}</h3></div>
            <button className="icon-button" type="button" onClick={close} aria-label="Fechar imagem ampliada"><X size={20} /></button>
          </header>
          <div className="photo-lightbox-image-wrap">
            <Image src={photo.url ?? ""} alt={alt} width={1600} height={1200} unoptimized />
          </div>
          <div className="photo-lightbox-details">
            <span className={`photo-lightbox-compliance ${photo.compliant ? "ok" : "fail"}`}>
              {photo.compliant ? <Check size={15} /> : <ShieldAlert size={15} />}
              {photo.compliant ? "Atende à norma" : "Não atende à norma"}
            </span>
            <span className="photo-lightbox-date">Foto registrada em {formatDate(photo.takenAt)}</span>
            <section className="photo-observation">
              <h4>Observação</h4>
              <p>{photo.observation?.trim() || "Nenhuma observação informada para esta foto."}</p>
            </section>
          </div>
        </div>
      </dialog>
    </>
  );
}

function EditPhotoModal({ machineId, photo }: { machineId: string; photo: MachineView["photos"][number] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `edit-photo-${photo.id}`;
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button className="photo-edit" type="button" onClick={() => dialogRef.current?.showModal()} aria-label={`Editar ${photo.caption}`}>
        <Pencil size={16} />
        <span>Editar</span>
      </button>
      <dialog ref={dialogRef} className="photo-modal" aria-labelledby={titleId} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div className="photo-modal-card">
          <header className="photo-modal-head">
            <div><span className="panel-kicker">Registro visual</span><h3 id={titleId}>Editar foto</h3></div>
            <button className="icon-button" type="button" onClick={close} aria-label="Fechar"><X size={18} /></button>
          </header>
          <SafeForm className="photo-modal-form" action={updateMachinePhotoAction}>
            <input type="hidden" name="machineId" value={machineId} />
            <input type="hidden" name="photoId" value={photo.id} />
            <label>Nome da foto<input name="caption" type="text" required defaultValue={photo.caption} autoFocus /></label>
            <label>Observação<textarea name="observation" rows={4} maxLength={2000} defaultValue={photo.observation ?? ""} placeholder="Descreva o que esta imagem registra, um detalhe observado ou o motivo da avaliação." /></label>
            <label>Data<input name="takenAt" type="date" required defaultValue={dateInputValue(photo.takenAt)} /></label>
            <fieldset className="photo-compliance-choice">
              <legend>Conformidade</legend>
              <label><input name="compliant" type="checkbox" value="true" defaultChecked={photo.compliant} /><span><strong>Atende à norma</strong><small>Desmarque quando a condição registrada não estiver conforme.</small></span></label>
            </fieldset>
            <div className="photo-modal-actions">
              <button className="button secondary" type="button" onClick={close}>Cancelar</button>
              <SavePhotoChangesButton />
            </div>
          </SafeForm>
        </div>
      </dialog>
    </>
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
          <SafeForm className="photo-modal-form" action={uploadMachinePhotoAction}>
            <input type="hidden" name="machineId" value={machineId} />
            <label>Nome da foto<input name="caption" type="text" required placeholder="Foto frontal" autoFocus /></label>
            <label>Observação<textarea name="observation" rows={4} maxLength={2000} placeholder="Descreva o que esta imagem registra ou um detalhe importante." /></label>
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
          </SafeForm>
        </div>
      </dialog>
    </>
  );
}

function SavePhotoButton() {
  const { pending } = useSafeFormStatus();
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}
      <span>{pending ? "Enviando..." : "Salvar foto"}</span>
    </button>
  );
}

function SavePhotoChangesButton() {
  const { pending } = useSafeFormStatus();
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={18} /> : <Save size={18} />}
      <span>{pending ? "Salvando..." : "Salvar alterações"}</span>
    </button>
  );
}

function RemovePhotoButton({ machineName }: { machineName: string }) {
  const { pending } = useSafeFormStatus();
  return (
    <button className="photo-remove" type="submit" disabled={pending} aria-label={`Remover foto de ${machineName}`}>
      {pending ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}
      <span>{pending ? "Removendo" : "Remover"}</span>
    </button>
  );
}
