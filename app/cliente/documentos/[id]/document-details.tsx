import { Calendar, CheckCircle2, ChevronRight, Download, ExternalLink, FileKey2, FileText, History, Link2, LockKeyhole, Paperclip, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import type { DocumentView } from "@/lib/data/types";

export function DocumentDetails({ document, companyName }: { document: DocumentView; companyName: string }) {
  const tone = document.status === "Válido" ? "valid" : document.status === "A vencer" ? "warning" : document.status === "Sem validade" ? "neutral" : "danger";
  const fileHref = `/api/documents/${document.id}/file`;
  return <div className="dashboard document-details-page">
    <div className="breadcrumb"><span>{companyName}</span><ChevronRight size={14} /><Link href="/cliente/documentos">Documentos</Link><ChevronRight size={14} /><strong>{document.id.slice(0, 8).toUpperCase()}</strong></div>
    <section className="document-detail-hero">
      <span className="document-detail-icon"><FileText size={30} /></span>
      <div><div className="document-detail-labels"><span className="document-type">{document.type}</span><span className={`doc-pill ${tone}`}>{document.status}</span></div><h1>{document.name}</h1><p>Versão {document.version} · {document.format} · {document.size}</p></div>
      <div className="document-detail-actions">
        {document.hasFile ? <>
          <a className="button secondary" href={fileHref} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Visualizar</a>
          <a className="button primary" href={`${fileHref}?download=1`}><Download size={16} /> Baixar arquivo</a>
        </> : <span className="document-missing-file">Nenhum arquivo anexado</span>}
      </div>
    </section>

    <div className="document-detail-layout">
      <div className="detail-main-column">
        <section className={`panel document-preview ${document.hasFile ? "has-file" : ""}`}>
          <header><span>{document.hasFile ? <><Paperclip size={15} /> Arquivo anexado</> : <><LockKeyhole size={15} /> Sem anexo</>}</span><small>{document.hasFile ? `${document.format} · ${document.size}` : "Cadastre novamente com um arquivo para disponibilizar o download"}</small></header>
          {document.hasFile && isImageFormat(document.format) ? <div className="document-preview-media"><img src={fileHref} alt={document.name} /></div> : <div>
            <FileKey2 size={45} />
            <strong>{document.hasFile ? "Documento disponível para a empresa" : "Nenhum arquivo foi anexado neste cadastro"}</strong>
            <p>{document.hasFile ? "O arquivo permanece restrito à empresa da sessão. Visualize em nova aba ou baixe para conferência." : "O registro foi salvo, mas ainda não há um PDF ou imagem vinculado."}</p>
            {document.hasFile ? <a className="button secondary" href={fileHref} target="_blank" rel="noreferrer"><ShieldCheck size={16} /> Abrir arquivo</a> : null}
          </div>}
        </section>
        <section className="panel detail-section"><div className="panel-header"><div><span className="panel-kicker">Sobre o registro</span><h2>Descrição</h2></div></div><div className="document-description"><p>{document.description}</p><dl><div><dt>Máquina vinculada</dt><dd><Link href={`/cliente/maquinas/${document.machineId}`}>{document.machineCode} · {document.machine}</Link></dd></div><div><dt>Tipo</dt><dd>{document.type}</dd></div><div><dt>Versão</dt><dd>{document.version}</dd></div><div><dt>Formato</dt><dd>{document.format} · {document.size}</dd></div></dl></div></section>
      </div>
      <aside className="detail-side-column">
        <section className={`document-validity-card ${tone}`}><span><Calendar size={20} /></span><div><small>Situação da validade</small><strong>{document.status}</strong><p>{validityMessage(document)}</p></div></section>
        <section className="panel document-metadata"><div className="panel-header"><div><span className="panel-kicker">Metadados</span><h2>Informações do documento</h2></div></div><dl><div><dt><Calendar size={14} /> Data de emissão</dt><dd>{document.issueDate}</dd></div><div><dt><Calendar size={14} /> Data de validade</dt><dd>{document.expirationDate}</dd></div><div><dt><UserRound size={14} /> Responsável</dt><dd>{document.responsible}</dd></div><div><dt><Link2 size={14} /> Origem</dt><dd>Portal Univelt</dd></div></dl></section>
        <section className="history-link"><History size={17} /><span><strong>Histórico de versões</strong><small>Alterações auditáveis no banco</small></span><ChevronRight size={17} /></section>
        <section className="document-integrity"><CheckCircle2 size={17} /><div><strong>Isolamento por empresa</strong><p>Este registro só é visível para a empresa vinculada ou para o admin Univelt.</p></div></section>
      </aside>
    </div>
  </div>;
}

function validityMessage(document: DocumentView) {
  if (document.daysLeft === null) return "Este tipo de documento não exige vencimento.";
  if (document.daysLeft < 0) return `Vencido há ${Math.abs(document.daysLeft)} dias.`;
  return `${document.daysLeft} dias restantes até ${document.expirationDate}.`;
}

function isImageFormat(format: string) {
  return ["PNG", "JPG", "JPEG", "WEBP"].includes(format.toUpperCase());
}
