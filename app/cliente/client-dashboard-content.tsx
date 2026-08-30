import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, FileText, Gauge, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import { greetingForNow } from "@/lib/labels";
import type { ActivityView, MachineView } from "@/lib/data/types";

type Metrics = Awaited<ReturnType<typeof import("@/lib/data/catalog").companyMetrics>>;

export function ClientDashboardContent({
  name,
  companyName,
  unitName,
  metrics,
  machines,
  activities,
}: {
  name: string;
  companyName: string;
  unitName: string;
  metrics: Metrics;
  machines: MachineView[];
  activities: ActivityView[];
}) {
  const attention = machines.filter((machine) => machine.appreciation === "Vencido" || machine.risk === "Muito alto" || machine.status === "Interditada").slice(0, 4);
  return (
    <div className="dashboard client-dashboard">
      <div className="breadcrumb" aria-label="Navegação estrutural">
        <span>{companyName}</span><ChevronRight size={14} /><span>{unitName}</span><ChevronRight size={14} /><strong>Visão geral</strong>
      </div>
      <section className="client-welcome">
        <div>
          <span className="eyebrow">Área exclusiva do cliente</span>
          <h1>{greetingForNow()}, {name.split(" ")[0]}</h1>
          <p>Estas são as prioridades de segurança da sua empresa neste momento.</p>
        </div>
        <div className="client-scope"><span>Escopo deste acesso</span><strong>{companyName} · {unitName}</strong><small>{metrics.machineCount} máquinas monitoradas</small></div>
      </section>
      <section className="metric-grid" aria-label="Indicadores da unidade">
        <article className="metric-card"><div className="metric-icon blue"><Wrench size={20} /></div><div className="metric-copy"><span>Máquinas da empresa</span><strong>{metrics.machineCount}</strong></div></article>
        <article className="metric-card"><div className="metric-icon red"><ShieldAlert size={20} /></div><div className="metric-copy"><span>Risco alto ou muito alto</span><strong>{metrics.highRisk}</strong></div></article>
        <article className="metric-card"><div className="metric-icon amber"><CalendarClock size={20} /></div><div className="metric-copy"><span>Documentos a vencer</span><strong>{metrics.expiring}</strong></div></article>
        <article className="metric-card"><div className="metric-icon green"><ClipboardCheck size={20} /></div><div className="metric-copy"><span>Atividades abertas</span><strong>{metrics.openActivities}</strong></div></article>
      </section>
      <div className="client-main-grid">
        <section className="panel client-attention">
          <div className="panel-header"><div><span className="panel-kicker">Prioridades</span><h2>O que precisa da sua atenção</h2></div><Link className="text-button" href="/cliente/maquinas">Ver todas <ChevronRight size={16} /></Link></div>
          <div className="attention-list">
            {attention.length === 0 && <p className="empty-copy">Nenhuma prioridade crítica no momento.</p>}
            {attention.map((item) => (
              <article className="attention-item" key={item.id}>
                <span className={`attention-icon ${item.riskTone.includes("critical") ? "danger" : "warning"}`}><ShieldAlert size={18} /></span>
                <div><strong>{item.name}</strong><small>{item.code}</small><p>{item.appreciation === "Vencido" ? "Documento vencido" : `${item.risk} · ${item.status}`}</p></div>
                <Link className="icon-button" href={`/cliente/maquinas/${item.id}`} aria-label={`Abrir ${item.name}`}><ChevronRight size={18} /></Link>
              </article>
            ))}
          </div>
        </section>
        <section className="panel client-compliance">
          <div className="panel-header"><div><span className="panel-kicker">Conformidade NR-12</span><h2>Situação da empresa</h2></div><Gauge size={19} /></div>
          <div className="client-score"><strong>{metrics.compliance}%</strong><span>documentação em conformidade</span></div>
          <div className="progress-track" aria-label={`${metrics.compliance}% em conformidade`}><span style={{ width: `${metrics.compliance}%` }} /></div>
          <dl className="client-score-list">
            <div><dt><CheckCircle2 size={15} /> Registros válidos</dt><dd>{metrics.valid}</dd></div>
            <div><dt><CalendarClock size={15} /> Próximos do vencimento</dt><dd>{metrics.expiring}</dd></div>
            <div><dt><ShieldAlert size={15} /> Vencidos ou ausentes</dt><dd>{metrics.expired + metrics.missingDocs}</dd></div>
          </dl>
        </section>
      </div>
      <div className="client-secondary-grid">
        <section className="panel client-shortcuts">
          <div className="panel-header"><div><span className="panel-kicker">Navegação</span><h2>Acesso rápido</h2></div></div>
          <div className="shortcut-grid">
            <Link href="/cliente/maquinas"><span className="shortcut-icon"><Wrench size={20} /></span><span><strong>Consultar máquinas</strong><small>{metrics.machineCount} equipamentos no escopo</small></span><ArrowRight size={17} /></Link>
            <Link href="/cliente/documentos"><span className="shortcut-icon"><FileText size={20} /></span><span><strong>Acessar documentos</strong><small>Apreciações, checklists e laudos</small></span><ArrowRight size={17} /></Link>
            <Link href="/cliente/atividades"><span className="shortcut-icon"><ClipboardCheck size={20} /></span><span><strong>Acompanhar atividades</strong><small>{activities.length} registros</small></span><ArrowRight size={17} /></Link>
          </div>
        </section>
        <section className="panel client-updates">
          <div className="panel-header"><div><span className="panel-kicker">Movimentações recentes</span><h2>Últimas atualizações</h2></div></div>
          <div className="client-update-list">
            {activities.slice(0, 4).map((activity) => <div key={activity.id}><span><ClipboardCheck size={16} /></span><p><strong>{activity.title}</strong><small>{activity.machine} · {activity.dueDate}</small></p></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
