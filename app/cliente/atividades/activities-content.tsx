"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, ChevronRight, CircleDashed, Clock3, Paperclip, Plus, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ActivityView } from "@/lib/data/types";

export function ActivitiesContent({ activities, companyName, canCreate }: { activities: ActivityView[]; companyName: string; canCreate: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [priority, setPriority] = useState("Todas");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = activities.filter((activity) => (!normalized || [activity.title, activity.machine, activity.machineCode, activity.responsible].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized))) && (status === "Todos" || activity.status === status) && (priority === "Todas" || activity.priority === priority));
  const activeFilters = (query ? 1 : 0) + (status !== "Todos" ? 1 : 0) + (priority !== "Todas" ? 1 : 0);
  function clearFilters() { setQuery(""); setStatus("Todos"); setPriority("Todas"); }

  return <div className="dashboard activities-page">
    <div className="breadcrumb"><span>{companyName}</span><ChevronRight size={14} /><strong>Atividades</strong></div>
    <section className="page-heading"><div><span className="eyebrow">Plano de ação</span><h1>Atividades e pendências</h1><p>Acompanhe responsáveis, prazos, e-mail e evidências das ações de segurança.</p></div>{canCreate && <Link className="button primary" href="/cliente/atividades/nova"><Plus size={16} /> Nova atividade</Link>}</section>

    <section className="activity-metrics" aria-label="Indicadores de atividades">
      <article><span className="activity-metric-icon blue"><CircleDashed size={19} /></span><div><strong>{activities.filter((item) => item.status === "Aberta").length}</strong><span>Abertas</span></div></article>
      <article><span className="activity-metric-icon amber"><Clock3 size={19} /></span><div><strong>{activities.filter((item) => item.status === "Em andamento").length}</strong><span>Em andamento</span></div></article>
      <article><span className="activity-metric-icon red"><AlertTriangle size={19} /></span><div><strong>{activities.filter((item) => item.status === "Atrasada").length}</strong><span>Atrasadas</span></div></article>
      <article><span className="activity-metric-icon green"><CheckCircle2 size={19} /></span><div><strong>{activities.filter((item) => item.status === "Concluída").length}</strong><span>Concluídas</span></div></article>
    </section>

    {activities.length === 0 && <div className="panel state-message"><CircleDashed size={28} /><strong>Nenhuma atividade cadastrada</strong><p>Crie a primeira atividade para acompanhar responsáveis, prazos e evidências.</p>{canCreate && <Link className="button primary" href="/cliente/atividades/nova"><Plus size={16} /> Criar primeira atividade</Link>}</div>}

    {activities.length > 0 && <>
    <section className="activity-filter-panel"><label className="machine-search"><Search size={18} /><span className="sr-only">Buscar atividades</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atividade, máquina, código ou responsável" /></label><label className="filter-select"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option>Aberta</option><option>Em andamento</option><option>Concluída</option><option>Atrasada</option></select><ChevronDown size={15} /></label><label className="filter-select"><span>Prioridade</span><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Todas</option><option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option></select><ChevronDown size={15} /></label>{activeFilters > 0 && <button className="clear-document-filters" type="button" onClick={clearFilters}><X size={14} /> Limpar filtros</button>}</section>

    <div className="activity-board-head"><span><strong>{filtered.length}</strong> atividades encontradas</span></div>
    <section className="activity-catalog">{filtered.map((activity) => <article className="activity-card" key={activity.id}>
      <div className="activity-card-leading"><span className={`activity-status-mark ${statusTone(activity.status)}`}>{statusIcon(activity.status)}</span><div><span className="activity-type">{activity.type}</span><Link href={`/cliente/atividades/${activity.id}`}>{activity.title}</Link><p>{activity.machineCode} · {activity.machine}</p></div></div>
      <div className="activity-card-meta"><span><UserRound size={14} /><small>Responsável</small><strong>{activity.responsible}</strong></span><span><CalendarClock size={14} /><small>Prazo</small><strong>{activity.dueDate}</strong></span></div>
      <div className="activity-progress"><div><span>Progresso</span><strong>{activity.progress}%</strong></div><span className="activity-progress-track"><span style={{ width: `${activity.progress}%` }} /></span></div>
      <div className="activity-card-end"><span className={`priority-label ${priorityTone(activity.priority)}`}>{activity.priority}</span><span className={`activity-status-label ${statusTone(activity.status)}`}>{activity.status}</span><small><Paperclip size={13} /> {activity.evidenceCount}</small><Link className="icon-button" href={`/cliente/atividades/${activity.id}`} aria-label={`Abrir ${activity.title}`}><ChevronRight size={18} /></Link></div>
    </article>)}</section>
    {filtered.length === 0 && <div className="panel state-message"><Search size={28} /><strong>Nenhuma atividade corresponde aos filtros</strong><p>Altere a busca, o status ou a prioridade para ampliar os resultados.</p><button className="button secondary" type="button" onClick={clearFilters}>Limpar filtros</button></div>}
    </>}
  </div>;
}

function statusTone(status: string) { return status === "Concluída" ? "completed" : status === "Atrasada" ? "overdue" : status === "Em andamento" ? "progress" : "open"; }
function priorityTone(priority: string) { return priority === "Crítica" ? "danger" : priority === "Alta" ? "warning" : "neutral"; }
function statusIcon(status: string) { return status === "Concluída" ? <CheckCircle2 size={18} /> : status === "Atrasada" ? <AlertTriangle size={18} /> : status === "Em andamento" ? <Clock3 size={18} /> : <CircleDashed size={18} />; }
