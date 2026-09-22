import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, ClipboardCheck, FileText, MinusCircle, Repeat2, UserRound, XCircle } from "lucide-react";
import Link from "next/link";
import type { MachineView } from "@/lib/data/types";
import { formatDateTime } from "@/lib/labels";
import { compareChecklistAnswers, summarizeChecklistAnswers } from "@/lib/checklist-analytics";
import { InfoHint } from "@/app/components/info-hint";

export function MachineChecklistDashboard({ machine }: { machine: MachineView }) {
  const latest = machine.checklists[0];
  if (!latest) {
    return <section className="panel machine-checklist-dashboard" id="checklist-dashboard"><div className="panel-header"><div><span className="panel-kicker">Dashboard do checklist</span><h2>Histórico da máquina</h2></div></div><div className="state-message compact"><ClipboardCheck size={28} /><strong>Nenhuma execução registrada</strong><p>Preencha um checklist para iniciar o acompanhamento desta máquina.</p><Link className="button primary" href={`/cliente/maquinas/${machine.id}/checklist`}>Preencher checklist</Link></div></section>;
  }

  const previous = machine.checklists.find((execution) => execution.id !== latest.id && execution.template.id === latest.template.id);
  const counts = summarizeChecklistAnswers(latest.answers);
  const compliance = counts.compliance;
  const comparison = compareChecklistAnswers(latest.answers, previous?.answers);
  const relatedPlans = machine.actionPlans.filter((plan) => plan.checklistExecutionId === latest.id);
  const relatedAttachments = relatedPlans.flatMap((plan) => plan.attachments.map((attachment) => ({ ...attachment, planId: plan.id, planTitle: plan.title })));

  return (
    <section className="panel machine-checklist-dashboard" id="checklist-dashboard">
      <div className="panel-header"><div><span className="panel-kicker">Dashboard do checklist</span><h2>{latest.template.name}</h2></div><Link className="text-button" href={`#checklist-execution-${latest.id}`}>Abrir preenchimento completo</Link></div>
      <div className="machine-checklist-summary">
        <div className="machine-checklist-score"><strong>{compliance}%</strong><span className="metric-label-with-info">Conformidade atual<InfoHint label="Como é calculada a conformidade atual">Percentual de respostas “Sim” entre as respostas aplicáveis da execução mais recente. Itens N/A não entram no cálculo.</InfoHint></span></div>
        <dl>
          <div><dt><CalendarClock size={15} /> Última execução</dt><dd>{formatDateTime(latest.executedAt)}</dd></div>
          <div><dt><UserRound size={15} /> Responsável</dt><dd>{latest.executedBy}</dd></div>
          <div><dt><CheckCircle2 size={15} /> Sim</dt><dd>{counts.yes}</dd></div>
          <div><dt><XCircle size={15} /> Não / parcial <InfoHint label="O que significa Não ou parcial">Respostas “Não” e “Parcial” são tratadas como não conformidades.</InfoHint></dt><dd>{counts.no}</dd></div>
          <div><dt><MinusCircle size={15} /> N/A</dt><dd>{counts.na}</dd></div>
          <div><dt><AlertTriangle size={15} /> Não preenchidos <InfoHint label="O que são itens não preenchidos">Itens ativos do modelo que ainda não possuem resposta nesta execução.</InfoHint></dt><dd>{counts.missing}</dd></div>
        </dl>
      </div>

      <div className="machine-checklist-comparison">
        <div className="comparison-heading"><div><span className="panel-kicker">Comparativo</span><h3 className="heading-with-info">Execução atual x anterior <InfoHint label="Como funciona o comparativo">Compara a execução mais recente com a execução anterior do mesmo modelo de checklist.</InfoHint></h3></div>{previous && <small>Anterior: {formatDateTime(previous.executedAt)}</small>}</div>
        {previous ? <div className="comparison-grid">
          <ComparisonCard icon={<ArrowUpRight />} label="Melhoraram" items={comparison.improved} tone="good" />
          <ComparisonCard icon={<ArrowDownRight />} label="Pioraram" items={comparison.worsened} tone="danger" />
          <ComparisonCard icon={<Repeat2 />} label="Reincidentes" items={comparison.recurring} tone="warning" />
        </div> : <p className="empty-copy comparison-empty">Esta é a primeira execução deste modelo. O comparativo ficará disponível no próximo preenchimento.</p>}
      </div>

      <div className="machine-checklist-related">
        <div><h3>Planos relacionados</h3>{relatedPlans.length ? relatedPlans.map((plan) => <Link key={plan.id} href={`#action-plan-${plan.id}`}><span>{plan.title}</span><small>{plan.items.length} ação(ões)</small></Link>) : <p className="empty-copy">Nenhum plano vinculado a esta execução.</p>}</div>
        <div><h3>Documentos e evidências</h3>{relatedAttachments.length ? relatedAttachments.map((attachment) => <a key={attachment.id} href={`/api/action-plans/${attachment.planId}/attachments/${attachment.id}/file`} target="_blank" rel="noreferrer"><FileText size={16} /><span>{attachment.name}</span><small>{attachment.size}</small></a>) : machine.documents.length ? machine.documents.slice(0, 3).map((document) => <Link key={document.id} href={`/cliente/documentos/${document.id}`}><FileText size={16} /><span>{document.name}</span><small>{document.type}</small></Link>) : <p className="empty-copy">Nenhum documento ou evidência disponível.</p>}</div>
      </div>
    </section>
  );
}

function ComparisonCard({ icon, label, items, tone }: { icon: React.ReactNode; label: string; items: string[]; tone: string }) {
  return <article className={tone}><header>{icon}<strong>{items.length}</strong><span>{label}</span></header>{items.length ? <ul>{items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul> : <p>Nenhum item.</p>}</article>;
}
