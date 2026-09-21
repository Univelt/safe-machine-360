import { Building2, CheckCircle2, ChevronRight, FileWarning, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import type { CompanyView } from "@/lib/data/types";

export function AdminDashboardContent({
  companies,
  metrics,
  contextName,
}: {
  companies: CompanyView[];
  metrics: Awaited<ReturnType<typeof import("@/lib/data/catalog").globalMetrics>>;
  contextName: string | null;
}) {
  return <div className="dashboard admin-dashboard">
    <div className="breadcrumb"><span>Portal Univelt</span><ChevronRight size={14} /><strong>Visão administrativa</strong></div>
    <section className="admin-welcome"><div><span className="eyebrow">{contextName ? "Contexto selecionado" : "Operação multiempresa"}</span><h1>{contextName ? contextName : "Visão global da plataforma"}</h1><p>{contextName ? "Indicadores e registros restritos à empresa selecionada." : "Acompanhe clientes, máquinas, conformidade e pendências em um único ambiente."}</p></div></section>
    <section className="metric-grid">
      <article className="metric-card"><div className="metric-icon blue"><Building2 size={20} /></div><div className="metric-copy"><span>{contextName ? "Empresa no contexto" : "Empresas clientes"}</span><strong>{metrics.companyCount}</strong><small className="positive">{metrics.unitCount} {metrics.unitCount === 1 ? "unidade ativa" : "unidades ativas"}</small></div></article>
      <article className="metric-card"><div className="metric-icon blue"><Wrench size={20} /></div><div className="metric-copy"><span>Máquinas monitoradas</span><strong>{metrics.machineCount}</strong><small>{contextName ? "Nesta empresa" : "Em todas as empresas"}</small></div></article>
      <article className="metric-card"><div className="metric-icon red"><ShieldAlert size={20} /></div><div className="metric-copy"><span>Risco alto ou muito alto</span><strong>{metrics.highRisk}</strong></div></article>
      <article className="metric-card"><div className="metric-icon amber"><FileWarning size={20} /></div><div className="metric-copy"><span>Pendências documentais</span><strong>{metrics.pendingDocs}</strong><small className="warning-text">{metrics.expired} vencidas</small></div></article>
    </section>
    <div className="admin-primary-grid">
      <section className="panel admin-companies-panel">
        <div className="panel-header"><div><span className="panel-kicker">{contextName ? "Empresa selecionada" : "Clientes"}</span><h2>{contextName ?? "Empresas na plataforma"}</h2></div><Link className="text-button" href="/admin/empresas">Gerenciar empresas <ChevronRight size={16} /></Link></div>
        <div className="admin-company-list">{companies.map((company) => <Link href={`/admin/maquinas?company=${encodeURIComponent(company.name)}`} aria-label={`Abrir empresa ${company.name}`} key={company.id}><span className="admin-company-avatar">{company.name.slice(0, 2).toUpperCase()}</span><div><strong>{company.name}</strong><small>{company.city} · {company.units} unidades</small></div><dl><div><dt>Máquinas</dt><dd>{company.machines}</dd></div><div><dt>Usuários</dt><dd>{company.users}</dd></div><div><dt>Conformidade</dt><dd className={company.compliance < 80 ? "warning-text" : "positive"}>{company.compliance}%</dd></div></dl><span className={`admin-status ${company.status === "Ativa" ? "active" : "demo"}`}>{company.status}</span><ChevronRight size={17} /></Link>)}</div>
      </section>
      <section className="panel admin-health">
        <div className="panel-header"><div><span className="panel-kicker">Saúde da operação</span><h2>{contextName ? "Resumo da empresa" : "Resumo global"}</h2></div></div>
        <div className="admin-global-score"><strong>{metrics.compliance}%</strong><span>conformidade média</span><div><span style={{ width: `${metrics.compliance}%` }} /></div></div>
        <div className="admin-health-list">
          <p><span className="status-icon valid"><CheckCircle2 size={15} /></span><span><strong>{metrics.compliantMachines}</strong> máquinas fora do risco alto</span></p>
          <p><span className="status-icon warning"><FileWarning size={15} /></span><span><strong>{metrics.pendingDocs}</strong> pendências documentais</span></p>
          <p><span className="status-icon danger"><ShieldAlert size={15} /></span><span><strong>{metrics.criticalActions}</strong> ações críticas abertas</span></p>
        </div>
      </section>
    </div>
  </div>;
}
