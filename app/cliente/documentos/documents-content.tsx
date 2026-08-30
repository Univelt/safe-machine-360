"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, ChevronRight, Download, FileCheck2, FileText, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DocumentView } from "@/lib/data/types";

export function DocumentsContent({ documents, companyName, canCreate }: { documents: DocumentView[]; companyName: string; canCreate: boolean }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = documents.filter((document) => (!normalized || [document.name, document.machine, document.machineCode, document.responsible].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized))) && (type === "Todos" || document.type === type) && (status === "Todos" || document.status === status));
  const activeFilters = (query ? 1 : 0) + (type !== "Todos" ? 1 : 0) + (status !== "Todos" ? 1 : 0);
  const types = [...new Set(documents.map((document) => document.type))].sort();
  const valid = documents.filter((document) => document.status === "Válido").length;
  const expiring = documents.filter((document) => document.status === "A vencer").length;
  const expired = documents.filter((document) => document.status === "Vencido").length;
  function clearFilters() { setQuery(""); setType("Todos"); setStatus("Todos"); }

  return <div className="dashboard documents-page">
    <div className="breadcrumb"><span>{companyName}</span><ChevronRight size={14} /><strong>Documentos</strong></div>
    <section className="page-heading"><div><span className="eyebrow">Controle documental</span><h1>Documentos e validades</h1><p>Acompanhe apreciações, checklists, laudos e registros vinculados às máquinas.</p></div>{canCreate && <Link className="button primary" href="/cliente/documentos/novo"><Plus size={16} /> Cadastrar documento</Link>}</section>

    <section className="document-metrics" aria-label="Indicadores documentais">
      <article><span className="document-metric-icon valid"><CheckCircle2 size={19} /></span><div><strong>{valid}</strong><span>Válidos</span></div></article>
      <article><span className="document-metric-icon warning"><CalendarClock size={19} /></span><div><strong>{expiring}</strong><span>A vencer</span></div></article>
      <article><span className="document-metric-icon danger"><AlertTriangle size={19} /></span><div><strong>{expired}</strong><span>Vencidos</span></div></article>
      <article><span className="document-metric-icon neutral"><FileCheck2 size={19} /></span><div><strong>{documents.length}</strong><span>Total vinculados</span></div></article>
    </section>

    <section className="document-filter-panel" aria-label="Filtros de documentos">
      <label className="machine-search"><Search size={18} /><span className="sr-only">Buscar documentos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar documento, máquina, código ou responsável" /></label>
      <label className="filter-select"><span>Tipo</span><select value={type} onChange={(event) => setType(event.target.value)}><option>Todos</option>{types.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
      <label className="filter-select"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option>Válido</option><option>A vencer</option><option>Vencido</option><option>Sem validade</option></select><ChevronDown size={15} /></label>
      {activeFilters > 0 && <button className="clear-document-filters" type="button" onClick={clearFilters}><X size={14} /> Limpar filtros</button>}
    </section>

    <section className="panel document-catalog">
      <header className="document-catalog-head"><span><strong>{filtered.length}</strong> documentos encontrados</span><small>Arquivos vinculados às máquinas da empresa</small></header>
      <div className="document-cards">{filtered.map((document) => <article key={document.id}>
        <span className="document-card-icon"><FileText size={21} /></span>
        <div className="document-card-main"><div><span className="document-type">{document.type}</span><span className={`doc-pill ${statusTone(document.status)}`}>{document.status}</span></div><Link href={`/cliente/documentos/${document.id}`}>{document.name}</Link><p>{document.machineCode} · {document.machine}</p></div>
        <dl><div><dt>Emissão</dt><dd>{document.issueDate}</dd></div><div><dt>Validade</dt><dd>{document.expirationDate}</dd></div><div><dt>Responsável</dt><dd>{document.responsible}</dd></div></dl>
        <div className="document-card-actions">{document.hasFile ? <a className="icon-button" href={`/api/documents/${document.id}/file?download=1`} aria-label={`Baixar ${document.name}`}><Download size={17} /></a> : <span className="icon-button" aria-disabled="true" title="Sem arquivo anexado"><Download size={17} /></span>}<Link className="icon-button" href={`/cliente/documentos/${document.id}`} aria-label={`Abrir ${document.name}`}><ChevronRight size={18} /></Link></div>
      </article>)}</div>
      {filtered.length === 0 && <div className="machine-empty"><Search size={28} /><strong>Nenhum documento encontrado</strong><p>Revise os filtros aplicados.</p><button className="button secondary" type="button" onClick={clearFilters}>Limpar filtros</button></div>}
    </section>
  </div>;
}

function statusTone(status: string) { return status === "Válido" ? "valid" : status === "A vencer" ? "warning" : status === "Sem validade" ? "neutral" : "danger"; }
