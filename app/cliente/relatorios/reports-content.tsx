import { BarChart3, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Download, FileText, ShieldAlert, Wrench } from "lucide-react";

export function ReportsContent({
  companyName,
  metrics,
}: {
  companyName: string;
  metrics: Awaited<ReturnType<typeof import("@/lib/data/catalog").companyMetrics>>;
}) {
  const total = metrics.machineCount || 1;
  return <div className="dashboard reports-page">
    <div className="breadcrumb"><span>{companyName}</span><ChevronRight size={14} /><strong>Relatórios</strong></div>
    <section className="page-heading"><div><span className="eyebrow">Inteligência operacional</span><h1>Relatórios e indicadores</h1><p>Consolide riscos, documentos e planos de ação com os dados reais da empresa.</p></div><button className="button primary" type="button"><Download size={16} /> Exportar visão executiva</button></section>
    <section className="report-filter-bar" aria-label="Filtros dos relatórios"><label><CalendarDays size={16} /><span>Período</span><select defaultValue="Últimos 6 meses"><option>Últimos 30 dias</option><option>Últimos 6 meses</option></select><ChevronDown size={14} /></label><label><BarChart3 size={16} /><span>Escopo</span><select defaultValue={companyName}><option>{companyName}</option></select><ChevronDown size={14} /></label></section>
    <section className="report-kpis" aria-label="Resumo executivo">
      <article><div><span>Conformidade geral</span><strong>{metrics.compliance}%</strong></div><span className="report-kpi-icon green"><CheckCircle2 size={21} /></span></article>
      <article><div><span>Risco alto ou muito alto</span><strong>{metrics.highRisk}</strong><small>{Math.round((metrics.highRisk / total) * 100)}% do parque</small></div><span className="report-kpi-icon red"><ShieldAlert size={21} /></span></article>
      <article><div><span>Documentos críticos</span><strong>{metrics.criticalDocuments}</strong><small>Vencidos ou ausentes</small></div><span className="report-kpi-icon amber"><FileText size={21} /></span></article>
      <article><div><span>Ações no prazo</span><strong>{metrics.onTimeRate}%</strong></div><span className="report-kpi-icon blue"><ClipboardCheck size={21} /></span></article>
    </section>
    <div className="report-primary-grid">
      <section className="panel trend-panel"><div className="panel-header"><div><span className="panel-kicker">Evolução</span><h2>Conformidade documental</h2></div></div><div className="trend-chart">{metrics.snapshots.length === 0 ? <p className="empty-copy">Sem série histórica ainda.</p> : <div className="trend-bars">{metrics.snapshots.map((item) => <div key={item.id}><span className="trend-value">{item.score}%</span><span className="trend-bar-track"><span style={{ height: `${item.score}%` }} /></span><small>{item.month}</small></div>)}</div>}</div></section>
      <section className="panel report-risk-panel"><div className="panel-header"><div><span className="panel-kicker">Parque de máquinas</span><h2>Distribuição de risco</h2></div></div><div className="report-risk-content"><div className="report-risk-donut"><div><strong>{metrics.machineCount}</strong><span>máquinas</span></div></div><div>{metrics.riskDistribution.map((item) => <p key={item.label}><span className={item.tone} />{item.label} <strong>{item.value}</strong></p>)}</div></div></section>
    </div>
    <section className="panel"><div className="panel-header"><div><span className="panel-kicker">Setores</span><h2>Conformidade por setor</h2></div></div><div className="sector-report-table"><header><span>Setor</span><span>Máquinas</span><span>Atenção</span><span>Score</span></header>{metrics.sectors.map((sector) => <div key={sector.name}><strong>{sector.name}</strong><span>{sector.machines}</span><span>{sector.attention}</span><span>{sector.score}%</span></div>)}</div></section>
    <section className="panel report-library"><div className="panel-header"><div><span className="panel-kicker">Biblioteca</span><h2>Relatórios disponíveis</h2></div></div>
      <article><Wrench size={20} /><div><strong>Inventário de máquinas</strong><p>Cadastro, TAG, fabricante e situação operacional.</p></div><span>XLSX</span></article>
      <article><FileText size={20} /><div><strong>Conformidade documental</strong><p>Validades e documentos ausentes por equipamento.</p></div><span>PDF</span></article>
      <article><ClipboardCheck size={20} /><div><strong>Plano de ação</strong><p>Atividades, prazos, responsáveis e progresso.</p></div><span>XLSX</span></article>
      <article><ShieldAlert size={20} /><div><strong>Matriz de riscos</strong><p>Classificação HRN e distribuição por setor.</p></div><span>PDF</span></article>
    </section>
  </div>;
}
