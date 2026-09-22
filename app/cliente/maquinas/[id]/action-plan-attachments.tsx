"use client";

import { Download, FileText, LoaderCircle, Paperclip, Trash2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

type ExistingAttachment = { id: string; name: string; format: string; size: string; uploadedBy: string; createdAt: Date | string };
type QueueItem = { id: string; file: File; progress: number; status: "ready" | "uploading" | "error"; error?: string };

const allowedMime = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const allowedExtension = new Set(["pdf", "doc", "docx"]);
const maxBytes = 20 * 1024 * 1024;

export function ActionPlanAttachments({ planId, attachments, canMutate }: { planId: string; attachments: ExistingAttachment[]; canMutate: boolean }) {
  const [existing, setExisting] = useState(attachments);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const requests = useRef(new Map<string, XMLHttpRequest>());

  function addFiles(files: File[]) {
    const next: QueueItem[] = [];
    const errors: string[] = [];
    files.forEach((file) => {
      const extension = file.name.toLowerCase().split(".").pop() ?? "";
      if (!allowedExtension.has(extension) || !allowedMime.has(file.type)) errors.push(`${file.name}: formato inválido.`);
      else if (file.size > maxBytes) errors.push(`${file.name}: excede 20 MB.`);
      else next.push({ id: crypto.randomUUID(), file, progress: 0, status: "ready" });
    });
    setQueue((current) => [...current, ...next]);
    setFeedback(errors.join(" "));
  }

  function upload(item: QueueItem) {
    const formData = new FormData();
    formData.append("file", item.file);
    const request = new XMLHttpRequest();
    requests.current.set(item.id, request);
    setQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "uploading", progress: 0, error: undefined } : entry));
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, progress: Math.round(event.loaded / event.total * 100) } : entry));
    };
    request.onload = () => {
      requests.current.delete(item.id);
      try {
        const payload = JSON.parse(request.responseText);
        if (request.status < 200 || request.status >= 300) throw new Error(payload.error ?? "Falha no envio.");
        setExisting((current) => [{ ...payload.attachment, createdAt: payload.attachment.createdAt }, ...current]);
        setQueue((current) => current.filter((entry) => entry.id !== item.id));
        setFeedback(`${item.file.name} enviado com sucesso.`);
      } catch (error) {
        setQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: error instanceof Error ? error.message : "Falha no envio." } : entry));
      }
    };
    request.onerror = () => setQueue((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "error", error: "Falha de rede durante o envio." } : entry));
    request.onabort = () => setQueue((current) => current.filter((entry) => entry.id !== item.id));
    request.open("POST", `/api/action-plans/${planId}/attachments`);
    request.send(formData);
  }

  function removeQueued(id: string) {
    const active = requests.current.get(id);
    if (active) active.abort();
    else setQueue((current) => current.filter((entry) => entry.id !== id));
  }

  async function removeExisting(attachment: ExistingAttachment) {
    if (!window.confirm(`Excluir o documento “${attachment.name}”? Esta ação será registrada no histórico.`)) return;
    const response = await fetch(`/api/action-plans/${planId}/attachments/${attachment.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeedback(payload.error ?? "Não foi possível excluir o documento.");
      return;
    }
    setExisting((current) => current.filter((entry) => entry.id !== attachment.id));
    setFeedback("Documento removido e alteração registrada no histórico.");
  }

  return (
    <div className="action-plan-attachments">
      <div className="action-plan-attachments-head"><div><Paperclip size={16} /><strong>Documentos do plano</strong></div><span>{existing.length} arquivo(s)</span></div>
      {existing.length > 0 && <ul className="attachment-list">{existing.map((attachment) => <li key={attachment.id}><FileText size={18} /><span><strong>{attachment.name}</strong><small>{attachment.format} · {attachment.size} · enviado por {attachment.uploadedBy} em {formatDate(attachment.createdAt)}</small></span><a className="icon-button" href={`/api/action-plans/${planId}/attachments/${attachment.id}/file?download=1`} aria-label={`Baixar ${attachment.name}`}><Download size={16} /></a>{canMutate && <button className="icon-button danger" type="button" onClick={() => removeExisting(attachment)} aria-label={`Excluir ${attachment.name}`}><Trash2 size={16} /></button>}</li>)}</ul>}
      {canMutate && <>
        <button className="attachment-dropzone" type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles([...event.dataTransfer.files]); }}><UploadCloud size={22} /><span><strong>Arraste PDF, DOC ou DOCX</strong><small>ou selecione arquivos de até 20 MB</small></span></button>
        <input ref={inputRef} className="sr-only" type="file" multiple accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { addFiles([...(event.target.files ?? [])]); event.target.value = ""; }} />
        {queue.length > 0 && <ul className="upload-queue">{queue.map((item) => <li key={item.id}><FileText size={17} /><span><strong>{item.file.name}</strong><small>{item.file.type || "Tipo desconhecido"} · {formatBytes(item.file.size)}</small>{item.status === "uploading" && <span className="upload-progress"><i style={{ width: `${item.progress}%` }} /></span>}{item.error && <em>{item.error}</em>}</span>{item.status === "ready" || item.status === "error" ? <button className="button secondary" type="button" onClick={() => upload(item)}>{item.status === "error" ? "Tentar novamente" : "Enviar"}</button> : <LoaderCircle className="spin" size={18} />}<button className="icon-button" type="button" onClick={() => removeQueued(item.id)} aria-label={`Cancelar ou remover ${item.file.name}`}><X size={16} /></button></li>)}</ul>}
      </>}
      {feedback && <p className="form-feedback" role="status">{feedback}</p>}
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1).replace(".", ",")} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
