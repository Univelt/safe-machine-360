"use client";

import { AlertTriangle, Building2, CheckCircle2, ChevronRight, ClipboardCheck, FilterX, MinusCircle, ShieldCheck, Wrench, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChecklistDashboardData } from "@/lib/data/checklist-dashboard";
import { checklistExecutionOutcome } from "@/lib/checklist-analytics";
import { InfoHint } from "@/app/components/info-hint";

const ALL = "ALL";

export function ChecklistDashboard({ data }: { data: ChecklistDashboardData }) {
  const [companyId, setCompanyId] = useState(data.initialCompanyId ?? ALL);
  const [machineId, setMachineId] = useState(ALL);
  const [templateId, setTemplateId] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(ALL);
  const [responsible, setResponsible] = useState(ALL);
  const [risk, setRisk] = useState(ALL);

  const responsibleOptions = useMemo(() => [...new Set(data.executions.map((item) => item.executedBy))].sort((a, b) => a.localeCompare(b, "pt-BR")), [data.executions]);
  const machineOptions = data.machines.filter((machine) => companyId === ALL || machine.companyId === companyId);

  const executions = useMemo(() => data.executions.filter((execution) => {
    const outcome = checklistExecutionOutcome(execution.answers.map((answer) => answer.result));
    const date = execution.executedAt.slice(0, 10);
    return (companyId === ALL || execution.company.id === companyId)
      && (machineId === ALL || execution.machine.id === machineId)
      && (templateId === ALL || execution.template.id === templateId)
      && (!dateFrom || date >= dateFrom)
      && (!dateTo || date <= dateTo)
      && (result === ALL || result === outcome)
      && (responsible === ALL || responsible === execution.executedBy)
      && (risk === ALL || risk === execution.machine.riskLevel);
  }), [companyId, data.executions, dateFrom, dateTo, machineId, responsible, result, risk, templateId]);

  const allAnswers = executions.flatMap((execution) => execution.answers);
  const yes = allAnswers.filter((answer) => answer.result === "SIM").length;
  const no = allAnswers.filter((answer) => answer.result === "NAO" || answer.result === "PARCIAL").length;
  const na = allAnswers.filter((answer) => answer.result === "NA").length;
  const applicable = yes + no;
  const compliance = applicable ? Math.round((yes / applicable) * 100) : 0;
  const nonCompliance = applicable ? Math.round((no / applicable) * 100) : 0;
  const evaluatedMachines = new Set(executions.map((execution) => execution.machine.id)).size;
  const candidateMachines = data.machines.filter((machine) => (companyId === ALL || machine.companyId === companyId) && (machineId === ALL || machine.id === machineId) && (risk === ALL || machine.riskLevel === risk));
  const unfilledMachines = candidateMachines.filter((machine) => !executions.some((execution) => execution.machine.id === machine.id)).length;
  const missingAnswers = executions.reduce((total, execution) => {
    const expected = data.templates.find((template) => template.id === execution.template.id)?.activeItems ?? execution.answers.length;
    return total + Math.max(0, expected - execution.answers.length);
  }, 0);

  const companyDistribution = groupExecutions(executions, (execution) => execution.company.name);
  const riskDistribution = groupExecutions(executions, (execution) => execution.riskLabel);
  const companyNonconformities = groupNonconformities(executions, (execution) => execution.company.name);
  const machineNonconformities = groupNonconformities(executions, (execution) => `${execution.machine.code} · ${execution.machine.name}`);
  const trend = complianceTrend(executions);
  const hasFilters = companyId !== (data.initialCompanyId ?? ALL) || machineId !== ALL || templateId !== ALL || dateFrom || dateTo || result !== ALL || responsible !== ALL || risk !== ALL;

  function resetFilters() {
    setCompanyId(data.initialCompanyId ?? ALL);
    setMachineId(ALL);
    setTemplateId(ALL);
    setDateFrom("");
    setDateTo("");
    setResult(ALL);
    setResponsible(ALL);
    setRisk(ALL);
  }

  return (
    <div className="dashboard checklist-dashboard-page">
      <div className="breadcrumb"><Link href="/cliente/checklists">Checklists</Link><ChevronRight size={14} /><strong>Dashboard</strong></div>
      <section className="page-heading">
        <div><span className="eyebrow">Qualidade operacional</span><h1>Dashboard de checklists</h1><p>Acompanhe execuções, conformidade e reincidências com dados persistidos no portal.</p></div>
        <Link className="button secondary" href="/cliente/checklists">Gerenciar modelos</Link>
      </section>

      <section className="panel checklist-dashboard-filters" aria-label="Filtros do dashboard">
        <label>Empresa<select value={companyId} disabled={!data.canSelectCompany} onChange={(event) => { setCompanyId(event.target.value); setMachineId(ALL); }}><option value={ALL}>Todas as empresas</option>{data.companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label>
        <label>Máquina<select value={machineId} onChange={(event) => setMachineId(event.target.value)}><option value={ALL}>Todas as máquinas</option>{machineOptions.map((machine) => <option value={machine.id} key={machine.id}>{machine.code} · {machine.name}</option>)}</select></label>
        <label>Modelo<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value={ALL}>Todos os modelos</option>{data.templates.filter((template) => !template.companyId || companyId === ALL || template.companyId === companyId).map((template) => <option value={template.id} key={template.id}>{template.name}</option>)}</select></label>
        <label>Data inicial<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label>Data final<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        <label>Status / resultado<select value={result} onChange={(event) => setResult(event.target.value)}><option value={ALL}>Todos</option><option value="CONFORME">Conforme</option><option value="NAO_CONFORME">Com não conformidade</option></select></label>
        <label>Responsável<select value={responsible} onChange={(event) => setResponsible(event.target.value)}><option value={ALL}>Todos</option>{responsibleOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
        <button className="button secondary" type="button" onClick={resetFilters} disabled={!hasFilters}><FilterX size={16} /> Limpar filtros</button>
      </section>

      <section className="checklist-kpi-grid" aria-label="Indicadores de checklists">
        <Kpi icon={<ClipboardCheck />} label="Execuções" value={executions.length} help="Quantidade de checklists preenchidos dentro dos filtros selecionados." />
        <Kpi icon={<Wrench />} label="Máquinas avaliadas" value={evaluatedMachines} help="Quantidade de máquinas diferentes que possuem ao menos uma execução no recorte atual." />
        <Kpi icon={<ShieldCheck />} label="Conformidade" value={`${compliance}%`} tone="good" help="Percentual de respostas “Sim” entre as respostas aplicáveis. Itens N/A não entram no cálculo." />
        <Kpi icon={<CheckCircle2 />} label="Respostas conformes" value={`${yes} · ${compliance}%`} tone="good" help="Total de respostas marcadas como “Sim” e sua participação entre as respostas aplicáveis." />
        <Kpi icon={<XCircle />} label="Não conformidades" value={`${no} · ${nonCompliance}%`} tone="danger" help="Soma das respostas “Não” e “Parcial”, com o percentual entre as respostas aplicáveis." />
        <Kpi icon={<MinusCircle />} label="Não aplicáveis" value={na} help="Itens marcados como N/A. Eles são exibidos no total, mas não alteram o percentual de conformidade." />
        <Kpi icon={<AlertTriangle />} label="Respostas pendentes" value={missingAnswers} tone="warning" help="Itens ativos do modelo que ainda não possuem uma resposta registrada nas execuções exibidas." />
        <Kpi icon={<Building2 />} label="Máquinas sem preenchimento" value={unfilledMachines} tone="warning" help="Máquinas do recorte atual que não possuem execução de checklist correspondente aos filtros." />
      </section>

      {data.executions.length === 0 ? (
        <div className="panel state-message"><ClipboardCheck size={30} /><strong>Nenhum checklist foi preenchido</strong><p>Os indicadores aparecerão após a primeira execução registrada.</p></div>
      ) : executions.length === 0 ? (
        <div className="panel state-message"><FilterX size={30} /><strong>Nenhum resultado para os filtros</strong><p>Altere o período ou limpe os filtros para ampliar a consulta.</p><button className="button secondary" type="button" onClick={resetFilters}>Limpar filtros</button></div>
      ) : (
        <>
          <div className="checklist-dashboard-grid">
            <Distribution title="Execuções por empresa" items={companyDistribution} onSelect={(label) => { const company = data.companies.find((item) => item.name === label); if (company) { setCompanyId(company.id); setMachineId(ALL); } }} />
            <Distribution title="Execuções por risco" items={riskDistribution} onSelect={(label) => { const machine = data.machines.find((item) => item.riskLabel === label); if (machine) setRisk(machine.riskLevel); }} />
            <Ranking title="Empresas com mais não conformidades" items={companyNonconformities} />
            <Ranking title="Máquinas com mais não conformidades" items={machineNonconformities} />
          </div>

          <section className="panel checklist-trend-panel">
            <div className="panel-header"><div><span className="panel-kicker">Evolução</span><h2>Conformidade ao longo do tempo</h2></div><small>Percentual de respostas “Sim” entre respostas aplicáveis</small></div>
            <div className="trend-chart" role="img" aria-label="Evolução mensal do percentual de conformidade">
              {trend.map((point) => <div key={point.key}><span className="trend-value">{point.value}%</span><div className="trend-track"><span style={{ height: `${Math.max(4, point.value)}%` }} /></div><small>{point.label}</small></div>)}
            </div>
          </section>

          <section className="panel latest-checklists">
            <div className="panel-header"><div><span className="panel-kicker">Atividade recente</span><h2>Últimas avaliações</h2></div><span>{executions.length} resultado(s)</span></div>
            <div className="responsive-table"><table><thead><tr><th>Data</th><th>Empresa</th><th>Máquina</th><th>Modelo</th><th>Responsável</th><th>Resultado</th><th><span className="sr-only">Abrir</span></th></tr></thead><tbody>{executions.slice(0, 10).map((execution) => {
              const outcome = checklistExecutionOutcome(execution.answers.map((answer) => answer.result));
              return <tr key={execution.id}><td>{formatDate(execution.executedAt)}</td><td>{execution.company.name}</td><td><strong>{execution.machine.code}</strong><small>{execution.machine.name}</small></td><td>{execution.template.name}</td><td>{execution.executedBy}</td><td><span className={`doc-pill ${outcome === "CONFORME" ? "valid" : "danger"}`}>{outcome === "CONFORME" ? "Conforme" : "Com não conformidade"}</span></td><td><Link className="icon-button" href={`/cliente/maquinas/${execution.machine.id}#checklist-execution-${execution.id}`} aria-label={`Abrir checklist de ${execution.machine.name}`}><ChevronRight size={17} /></Link></td></tr>;
            })}</tbody></table></div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, help, tone = "neutral" }: { icon: React.ReactNode; label: string; value: string | number; help: string; tone?: "neutral" | "good" | "danger" | "warning" }) {
  return <article className={`checklist-kpi ${tone}`}><span>{icon}</span><div><strong>{value}</strong><small className="metric-label-with-info">{label}<InfoHint label={`Como é calculado: ${label}`}>{help}</InfoHint></small></div></article>;
}

function Distribution({ title, items, onSelect }: { title: string; items: Array<{ label: string; value: number }>; onSelect: (label: string) => void }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return <section className="panel compact-chart"><div className="panel-header"><div><span className="panel-kicker">Distribuição</span><h2>{title}</h2></div></div><div className="horizontal-bars">{items.map((item) => <button type="button" key={item.label} onClick={() => onSelect(item.label)} aria-label={`Filtrar por ${item.label}, ${item.value} execuções`}><span>{item.label}</span><span className="bar-track"><i style={{ width: `${Math.max(5, item.value / max * 100)}%` }} /></span><strong>{item.value}</strong></button>)}</div></section>;
}

function Ranking({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return <section className="panel compact-chart"><div className="panel-header"><div><span className="panel-kicker">Prioridade</span><h2>{title}</h2></div></div>{items.length ? <ol className="ranking-list">{items.slice(0, 5).map((item) => <li key={item.label}><span>{item.label}</span><strong>{item.value}</strong></li>)}</ol> : <p className="empty-copy">Nenhuma não conformidade no recorte atual.</p>}</section>;
}

function groupExecutions<T>(items: T[], labelOf: (item: T) => string) {
  const groups = new Map<string, number>();
  items.forEach((item) => groups.set(labelOf(item), (groups.get(labelOf(item)) ?? 0) + 1));
  return [...groups].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function groupNonconformities<T extends { answers: Array<{ result: string }> }>(items: T[], labelOf: (item: T) => string) {
  const groups = new Map<string, number>();
  items.forEach((item) => {
    const count = item.answers.filter((answer) => answer.result === "NAO" || answer.result === "PARCIAL").length;
    if (count) groups.set(labelOf(item), (groups.get(labelOf(item)) ?? 0) + count);
  });
  return [...groups].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function complianceTrend(executions: ChecklistDashboardData["executions"]) {
  const groups = new Map<string, { yes: number; no: number }>();
  executions.forEach((execution) => {
    const key = execution.executedAt.slice(0, 7);
    const current = groups.get(key) ?? { yes: 0, no: 0 };
    execution.answers.forEach((answer) => {
      if (answer.result === "SIM") current.yes += 1;
      if (answer.result === "NAO" || answer.result === "PARCIAL") current.no += 1;
    });
    groups.set(key, current);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([key, value]) => ({
    key,
    label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(new Date(`${key}-15T12:00:00`)).replace(" de ", "/"),
    value: value.yes + value.no ? Math.round(value.yes / (value.yes + value.no) * 100) : 0,
  }));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}
