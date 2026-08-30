import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, History, MessageSquareText, Paperclip, UserRound, Wrench } from "lucide-react";
import Link from "next/link";
import { ActivityEvidence } from "./activity-evidence";
import { ActivityProgress } from "./activity-progress";
import type { ActivityView } from "@/lib/data/types";

export function ActivityDetails({ activity, companyName, canMutate }: { activity: ActivityView; companyName: string; canMutate: boolean }) {
  const statusTone = activity.status === "Concluída" ? "completed" : activity.status === "Atrasada" ? "overdue" : activity.status === "Em andamento" ? "progress" : "open";
  const priorityTone = activity.priority === "Crítica" ? "danger" : activity.priority === "Alta" ? "warning" : "neutral";
  return <div className="dashboard activity-details-page">
    <div className="breadcrumb"><span>{companyName}</span><ChevronRight size={14} /><Link href="/cliente/atividades">Atividades</Link><ChevronRight size={14} /><strong>{activity.id.slice(0, 8).toUpperCase()}</strong></div>
    <section className="activity-detail-hero"><span className={`activity-detail-icon ${statusTone}`}><ClipboardCheck size={27} /></span><div><div className="activity-detail-labels"><span className="activity-type">{activity.type}</span><span className={`priority-label ${priorityTone}`}>{activity.priority}</span><span className={`activity-status-label ${statusTone}`}>{activity.status}</span></div><h1>{activity.title}</h1><p>{activity.machineCode} · {activity.machine}</p></div></section>

    <div className="activity-detail-layout"><div className="detail-main-column">
      <section className="panel detail-section"><div className="panel-header"><div><span className="panel-kicker">Escopo</span><h2>Descrição da atividade</h2></div></div><div className="activity-description"><p>{activity.description}</p><ActivityProgress activityId={activity.id} progress={activity.progress} canMutate={canMutate} /></div></section>
      <ActivityEvidence activity={activity} canMutate={canMutate} />
      <section className="panel detail-section"><div className="panel-header"><div><span className="panel-kicker">Linha do tempo</span><h2>Histórico da execução</h2></div></div><div className="activity-detail-timeline"><div><span className="completed"><CheckCircle2 size={15} /></span><article><strong>Atividade criada</strong><p>Registro incluído no plano de ação.</p><small>{activity.createdAt} · Portal Univelt</small></article></div><div><span className="progress"><Clock3 size={15} /></span><article><strong>Responsável notificado</strong><p>{activity.responsible}{activity.responsibleEmail ? ` · ${activity.responsibleEmail}` : ""}.</p><small>{activity.createdAt}</small></article></div>{activity.executedAt !== "—" && <div><span className="completed"><MessageSquareText size={15} /></span><article><strong>Data executada</strong><p>Conclusão informada em {activity.executedAt}.</p></article></div>}</div></section>
    </div><aside className="detail-side-column">
      <section className="panel activity-meta-card"><div className="panel-header"><div><span className="panel-kicker">Planejamento</span><h2>Responsáveis e prazos</h2></div></div><dl><div><dt><UserRound size={14} /> Responsável</dt><dd>{activity.responsible}</dd></div><div><dt>E-mail</dt><dd>{activity.responsibleEmail ?? "—"}</dd></div><div><dt><CalendarClock size={14} /> Data prevista</dt><dd>{activity.dueDate}</dd></div><div><dt><CalendarClock size={14} /> Data executada</dt><dd>{activity.executedAt}</dd></div><div><dt><Paperclip size={14} /> Evidências</dt><dd>{activity.evidenceCount} registros</dd></div></dl></section>
      <Link className="activity-machine-link" href={`/cliente/maquinas/${activity.machineId}`}><span><Wrench size={19} /></span><div><small>Máquina relacionada</small><strong>{activity.machine}</strong><p>{activity.machineCode}</p></div><ChevronRight size={17} /></Link>
      <section className="machine-alert"><AlertTriangle size={19} /><div><strong>Isolamento</strong><p>Esta atividade pertence somente à empresa do equipamento vinculado.</p></div></section>
      <section className="history-link"><History size={17} /><span><strong>Registro auditável</strong><small>Alterações preservadas no histórico</small></span><ChevronRight size={17} /></section>
    </aside></div>
  </div>;
}
