"use client";

import { ChevronDown, ChevronUp, History, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { auditActionLabels, auditEntityLabels, formatDateTime, humanizeAuditCode } from "@/lib/labels";

export type AuditLogView = {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  companyId: string | null;
  companyName: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
};

const PAGE_SIZE = 20;

export function HistoryContent({ logs }: { logs: AuditLogView[] }) {
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<string | null>(null);

  const companies = useMemo(() => uniqueOptions(logs, "companyId", "companyName"), [logs]);
  const users = useMemo(() => uniqueOptions(logs, "userId", "userName"), [logs]);
  const actions = useMemo(() => [...new Set(logs.map((log) => log.action))].sort(), [logs]);
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = logs.filter((log) => {
    const created = new Date(log.createdAt);
    const matchesText = !normalized || [log.summary, log.entityId, log.companyName ?? "", log.userName ?? "", log.userEmail ?? "", auditActionLabels[log.action] ?? log.action]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized));
    const matchesFrom = !from || created >= new Date(`${from}T00:00:00`);
    const matchesTo = !to || created <= new Date(`${to}T23:59:59.999`);
    return matchesText && (!companyId || log.companyId === companyId) && (!action || log.action === action) && (!userId || log.userId === userId) && matchesFrom && matchesTo;
  });
  const activeFilters = [query, companyId, action, userId, from, to].filter(Boolean).length;

  function clearFilters() {
    setQuery("");
    setCompanyId("");
    setAction("");
    setUserId("");
    setFrom("");
    setTo("");
    setVisible(PAGE_SIZE);
  }

  return (
    <div className="dashboard admin-list-page history-page">
      <section className="page-heading"><div><span className="eyebrow">Auditoria operacional</span><h1>Histórico de alterações</h1><p>Veja quem alterou o quê, quando e em qual empresa.</p></div></section>

      <section className="panel history-filters" aria-label="Filtros do histórico">
        <label className="machine-search"><Search size={17} /><span className="sr-only">Buscar no histórico</span><input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(PAGE_SIZE); }} placeholder="Buscar resumo, autor ou identificador" /></label>
        <label><span>Empresa</span><select value={companyId} onChange={(event) => { setCompanyId(event.target.value); setVisible(PAGE_SIZE); }}><option value="">Todas</option>{companies.map((company) => <option key={company.value} value={company.value}>{company.label}</option>)}</select></label>
        <label><span>Ação</span><select value={action} onChange={(event) => { setAction(event.target.value); setVisible(PAGE_SIZE); }}><option value="">Todas</option>{actions.map((value) => <option key={value} value={value}>{auditActionLabels[value] ?? humanizeAuditCode(value)}</option>)}</select></label>
        <label><span>Usuário</span><select value={userId} onChange={(event) => { setUserId(event.target.value); setVisible(PAGE_SIZE); }}><option value="">Todos</option>{users.map((user) => <option key={user.value} value={user.value}>{user.label}</option>)}</select></label>
        <label><span>De</span><input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setVisible(PAGE_SIZE); }} /></label>
        <label><span>Até</span><input type="date" value={to} onChange={(event) => { setTo(event.target.value); setVisible(PAGE_SIZE); }} /></label>
        {activeFilters > 0 && <button className="button secondary compact" type="button" onClick={clearFilters}><X size={15} /> Limpar filtros</button>}
      </section>

      <div className="result-count"><History size={16} /><strong>{filtered.length}</strong> registros encontrados</div>
      <section className="panel history-table">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Data e hora</th><th>Autor</th><th>Empresa</th><th>Ação</th><th>Resumo</th><th><span className="sr-only">Detalhes</span></th></tr></thead>
            <tbody>
              {filtered.slice(0, visible).map((log) => <HistoryRow key={log.id} log={log} expanded={expanded === log.id} onToggle={() => setExpanded((current) => current === log.id ? null : log.id)} />)}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="state-message"><Search size={24} /><strong>Nenhum registro encontrado</strong><p>Revise os filtros ou o período selecionado.</p>{activeFilters > 0 && <button className="button secondary" type="button" onClick={clearFilters}>Limpar filtros</button>}</div>}
        {visible < filtered.length && <div className="load-more"><button className="button secondary" type="button" onClick={() => setVisible((value) => value + PAGE_SIZE)}>Carregar mais {Math.min(PAGE_SIZE, filtered.length - visible)} registros</button></div>}
      </section>
    </div>
  );
}

function HistoryRow({ log, expanded, onToggle }: { log: AuditLogView; expanded: boolean; onToggle: () => void }) {
  return <>
    <tr>
      <td data-label="Data e hora"><time dateTime={log.createdAt}>{formatDateTime(log.createdAt)}</time></td>
      <td data-label="Autor"><strong>{log.userName ?? "Sistema"}</strong><small>{log.userEmail ?? "Ação automática"}</small></td>
      <td data-label="Empresa">{log.companyName ?? "Administração Univelt"}</td>
      <td data-label="Ação"><span className="audit-action">{auditActionLabels[log.action] ?? humanizeAuditCode(log.action)}</span><small>{auditEntityLabels[log.entity] ?? log.entity}</small></td>
      <td data-label="Resumo">{log.summary}</td>
      <td><button className="icon-button" type="button" aria-label={expanded ? "Ocultar detalhes técnicos" : "Mostrar detalhes técnicos"} aria-expanded={expanded} onClick={onToggle}>{expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button></td>
    </tr>
    {expanded && <tr className="history-technical-row"><td colSpan={6}><dl><div><dt>Código da ação</dt><dd>{log.action}</dd></div><div><dt>Entidade</dt><dd>{log.entity}</dd></div><div><dt>Identificador</dt><dd>{log.entityId}</dd></div><div><dt>ID do registro</dt><dd>{log.id}</dd></div></dl></td></tr>}
  </>;
}

function uniqueOptions(logs: AuditLogView[], valueKey: "companyId" | "userId", labelKey: "companyName" | "userName") {
  const map = new Map<string, string>();
  for (const log of logs) {
    const value = log[valueKey];
    const label = log[labelKey];
    if (value && label) map.set(value, label);
  }
  return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}
