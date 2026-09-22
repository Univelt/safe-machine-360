"use client";

import { FileText, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

const allowedMime = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const allowedExtension = new Set(["pdf", "doc", "docx"]);

export function ActionPlanDraftAttachments() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  function updateFiles(next: File[]) {
    const valid: File[] = [];
    const invalid: string[] = [];
    next.forEach((file) => {
      const extension = file.name.toLowerCase().split(".").pop() ?? "";
      if (!allowedExtension.has(extension) || !allowedMime.has(file.type)) invalid.push(`${file.name}: use PDF, DOC ou DOCX.`);
      else if (file.size > 20 * 1024 * 1024) invalid.push(`${file.name}: o limite é 20 MB.`);
      else valid.push(file);
    });
    syncInput(valid);
    setFiles(valid);
    setError(invalid.join(" "));
  }

  function syncInput(next: File[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    next.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }

  return (
    <div className="action-plan-draft full">
      <span className="record-label">Documentos do plano</span>
      <button className="attachment-dropzone" type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); updateFiles([...files, ...event.dataTransfer.files]); }}><Paperclip size={21} /><span><strong>Arraste ou selecione PDF, DOC e DOCX</strong><small>Até 20 MB por arquivo. Você pode remover antes de salvar.</small></span></button>
      <input ref={inputRef} className="sr-only" type="file" name="attachments" multiple accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => updateFiles([...files, ...(event.target.files ? [...event.target.files] : [])])} />
      {files.length > 0 && <ul className="upload-queue draft">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}`}><FileText size={17} /><span><strong>{file.name}</strong><small>{file.type} · {formatBytes(file.size)}</small></span><button className="icon-button" type="button" onClick={() => updateFiles(files.filter((_, current) => current !== index))} aria-label={`Remover ${file.name}`}><X size={16} /></button></li>)}</ul>}
      {error && <p className="form-feedback error" role="alert">{error}</p>}
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1).replace(".", ",")} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
