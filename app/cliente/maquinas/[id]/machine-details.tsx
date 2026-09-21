import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, Download, History, MapPin, Settings2, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MachinePhotos } from "./machine-photos";
import type { MachineView } from "@/lib/data/types";
import { categoryLabels, checklistAnswerLabels, checklistAnswerTones, documentStatusLabels, documentTone, formatDate, formatDateTime } from "@/lib/labels";
import { RiskBadge } from "@/app/components/risk-badge";
import { classifyHrn } from "@/lib/labels";
import { MachineDeleteForm } from "./machine-delete-form";
import { MachineSectionNavigation } from "./machine-section-navigation";

export function MachineDetails({ machine, canMutate, canManage }: { machine: MachineView; canMutate: boolean; canManage: boolean }) {
  const latestApr = machine.riskAssessments[0];
  const latestPlan = machine.actionPlans[0];
  const cover = machine.photos.find((photo) => photo.url);

  return (
    <div className="dashboard machine-details-page">
      <div className="breadcrumb"><span>{machine.companyName}</span><ChevronRight size={14} /><Link href="/cliente/maquinas">Máquinas</Link><ChevronRight size={14} /><strong>{machine.code}</strong></div>

      <section className="machine-hero">
        <div className="machine-hero-image">{cover?.url ? <Image src={cover.url} alt={`Vista principal da máquina ${machine.name}, código ${machine.code}`} width={132} height={108} unoptimized priority /> : <><Wrench size={38} /><span>Foto do equipamento</span></>}</div>
        <div className="machine-hero-copy"><div className="machine-hero-meta"><span className={`badge ${machine.riskTone}`}><span />{machine.risk}</span><span className={`operation-status ${machine.status === "Operacional" ? "online" : machine.status === "Interditada" ? "blocked" : "maintenance"}`}><span />{machine.status}</span></div><h1>{machine.name}</h1><p>{machine.code} · TAG {machine.tag} · Série {machine.serial}</p><div className="machine-location"><span><MapPin size={15} /> {machine.unitName} · {machine.sector} · {machine.area}</span><span><Settings2 size={15} /> {machine.manufacturer} · {machine.model}</span></div></div>
        {(canManage || canMutate) && <div className="machine-hero-actions">
          {canManage && <Link className="button secondary" href={`/cliente/maquinas/${machine.id}/editar`}>Editar máquina</Link>}
          {canManage && <MachineDeleteForm machine={{
            id: machine.id,
            name: machine.name,
            code: machine.code,
            documents: machine.documents.length,
            riskAssessments: machine.riskAssessments.length,
            checklists: machine.checklists.length,
            actionPlans: machine.actionPlans.length,
            activities: machine.activities.length,
            photos: machine.photos.length,
          }} />}
          {canMutate && <Link className="button secondary" href={`/cliente/maquinas/${machine.id}/apr`}>Cadastrar APR</Link>}
          {canMutate && <Link className="button primary" href={`/cliente/documentos/novo?machineId=${machine.id}`}>Anexar documento</Link>}
        </div>}
      </section>

      <MachineSectionNavigation />

      <div className="detail-layout" id="visao-geral">
        <div className="detail-main-column">
          <section className="panel detail-section"><div className="panel-header"><div><span className="panel-kicker">Identificação</span><h2>Informações do equipamento</h2></div></div><div className="machine-description"><p>{machine.description}</p><dl>
            <div><dt>Código interno</dt><dd>{machine.code}</dd></div>
            <div><dt>Patrimônio/TAG</dt><dd>{machine.assetTag ?? machine.tag}</dd></div>
            <div><dt>Número de série</dt><dd>{machine.serial}</dd></div>
            <div><dt>Tipo</dt><dd>{machine.machineType ?? "—"}</dd></div>
            <div><dt>Fabricante</dt><dd>{machine.manufacturer}</dd></div>
            <div><dt>Modelo</dt><dd>{machine.model}</dd></div>
            <div><dt>Ano</dt><dd>{machine.year || "Não identificado"}</dd></div>
            <div><dt>Capacidade</dt><dd>{machine.capacity ?? "—"}</dd></div>
            <div><dt>Documento</dt><dd>{machine.documentNumber ?? "—"}</dd></div>
            <div><dt>Revisão</dt><dd>{machine.documentRevision ?? "—"}</dd></div>
          </dl></div></section>

          <MachinePhotos machine={machine} canMutate={canMutate} />

          <section className="panel detail-section" id="documentos"><div className="panel-header"><div><span className="panel-kicker">Controle documental</span><h2>Documentos vinculados à máquina</h2></div>{canMutate && <Link className="text-button" href={`/cliente/documentos/novo?machineId=${machine.id}`}>Anexar <ChevronRight size={16} /></Link>}</div>
            <div className="machine-section-body">
              <div className="document-list">
                {machine.documents.length === 0 && <p className="empty-copy">Nenhum documento vinculado.</p>}
                {machine.documents.map((document) => (
                  <article key={document.id}><span className={`document-file-icon ${documentTone(document.status)}`}><ShieldAlert size={19} /></span><div><strong>{document.name}</strong><small>{document.type} · Versão {document.version} · {document.size}</small></div><span><strong>{documentStatusLabels[document.status]}</strong><small>Validade: {document.expirationDate}</small></span><Link className="icon-button" href={`/cliente/documentos/${document.id}`} aria-label="Abrir documento"><Download size={17} /></Link></article>
                ))}
              </div>
            </div>
          </section>

          <section className="panel detail-section" id="apr">
            <div className="panel-header"><div><span className="panel-kicker">Análise de risco</span><h2>APR da máquina</h2></div>{canMutate && <Link className="text-button" href={`/cliente/maquinas/${machine.id}/apr`}>Nova APR <ChevronRight size={16} /></Link>}</div>
            <div className="machine-section-body">
              {latestApr ? (
                <dl>
                  <div><dt>Número do documento</dt><dd>{latestApr.documentNumber}</dd></div>
                  <div><dt>Revisão</dt><dd>{latestApr.revision}</dd></div>
                  <div><dt>Categoria</dt><dd>{categoryLabels[latestApr.category]}</dd></div>
                  <div><dt>HRN atual</dt><dd className="hrn-detail-value">{latestApr.hrnCurrent}<RiskBadge level={classifyHrn(latestApr.hrnCurrent)} /></dd></div>
                  <div><dt>HRN residual</dt><dd className="hrn-detail-value">{latestApr.hrnResidual}<RiskBadge level={classifyHrn(latestApr.hrnResidual)} /></dd></div>
                  <div><dt>Emissão</dt><dd>{formatDate(latestApr.issuedAt)}</dd></div>
                </dl>
              ) : <p className="empty-copy">Nenhuma APR cadastrada.</p>}
            </div>
          </section>

          <section className="panel detail-section" id="checklist">
            <div className="panel-header"><div><span className="panel-kicker">Checklist NR-12</span><h2>Itens cadastrados no banco</h2></div>{canMutate && <Link className="text-button" href={`/cliente/maquinas/${machine.id}/checklist`}>Preencher checklist <ChevronRight size={16} /></Link>}</div>
            <div className="machine-section-body">
              {machine.checklists.length === 0 && <p className="empty-copy">Nenhum checklist preenchido nesta máquina.</p>}
              {machine.checklists.map((execution) => (
                <div className="checklist-execution" key={execution.id}>
                  <header>
                    <strong>{execution.template.name}</strong>
                    <small>{formatDateTime(execution.executedAt)} · {execution.executedBy}</small>
                  </header>
                  <ol className="checklist-item-list compact fill">
                    {execution.answers.sort((a, b) => a.item.number - b.item.number).map((answer) => (
                      <li key={answer.id}>
                        <span className="checklist-num">{answer.item.number}</span>
                        <p>{answer.item.description}</p>
                        <span className={`answer-pill ${checklistAnswerTones[answer.result]}`}>{checklistAnswerLabels[answer.result]}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="change-log">Log: última execução em <strong>{formatDateTime(execution.executedAt)}</strong> por <strong>{execution.executedBy}</strong>.</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel detail-section" id="plano">
            <div className="panel-header"><div><span className="panel-kicker">Plano de ação NR-12</span><h2>{latestPlan?.title ?? "Ações corretivas"}</h2></div>{canMutate && <Link className="text-button" href={`/cliente/maquinas/${machine.id}/plano`}>Novo plano <ChevronRight size={16} /></Link>}</div>
            <div className="machine-section-body">
              {latestPlan ? (
                <div className="action-table">
                  <header><span>N</span><span>Local</span><span>Não conformidade</span><span>Ação</span><span>Responsável</span></header>
                  {latestPlan.items.map((item) => (
                    <div key={item.id}><span>{item.sequence}</span><span>{item.location}</span><span>{item.nonconformity}</span><span>{item.action}</span><strong>{item.responsible}</strong></div>
                  ))}
                </div>
              ) : <p className="empty-copy">Nenhum plano de ação cadastrado.</p>}
            </div>
          </section>

          <section className="panel detail-section" id="atividades"><div className="panel-header"><div><span className="panel-kicker">Acompanhamento</span><h2>Atividades da máquina</h2></div>{canMutate && <Link className="text-button" href={`/cliente/atividades/nova?machineId=${machine.id}`}>Nova atividade <ChevronRight size={16} /></Link>}</div>
            <div className="machine-section-body">
              <div className="machine-timeline">
                {machine.activities.length === 0 && <p className="empty-copy">Nenhuma atividade vinculada.</p>}
                {machine.activities.map((activity) => (
                  <div key={activity.id}><span className={`timeline-dot ${activity.status === "CONCLUIDA" ? "completed" : "pending"}`}>{activity.status === "CONCLUIDA" ? <CheckCircle2 size={15} /> : <CalendarClock size={15} />}</span><article><strong>{activity.title}</strong><p>{activity.responsible} · prazo {formatDate(activity.dueDate)}</p><small>{activity.responsibleEmail ?? "Sem e-mail cadastrado"}</small></article></div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="detail-side-column">
          <section className="panel risk-summary"><div className="panel-header"><div><span className="panel-kicker">Avaliação de risco</span><h2>Classificação atual</h2></div></div><div className="risk-number"><ShieldAlert size={26} /><strong>{machine.hrn}</strong><span>HRN atual</span></div><dl><div><dt>Nível</dt><dd><RiskBadge level={machine.riskLevel} /></dd></div><div><dt>HRN residual</dt><dd className="hrn-detail-value">{machine.hrnResidual ?? "—"}{machine.hrnResidual && <RiskBadge level={classifyHrn(machine.hrnResidual)} />}</dd></div><div><dt>Categoria</dt><dd>{machine.category ? categoryLabels[machine.category] : "—"}</dd></div><div><dt>Situação NR-12</dt><dd>{machine.status === "Interditada" ? "Adequação necessária" : "Monitorada"}</dd></div></dl></section>
          <section className="panel quick-facts" id="dados-tecnicos"><div className="panel-header"><div><span className="panel-kicker">Dados técnicos</span><h2>Características operacionais</h2></div></div><dl>
            <div><dt>Fontes de energia</dt><dd>{machine.energy}</dd></div>
            <div><dt>Sistemas</dt><dd>{machine.mainSystems ?? "—"}</dd></div>
            <div><dt>Utilização</dt><dd>{machine.usage ?? "—"}</dd></div>
            <div><dt>Processo</dt><dd>{machine.processCharacteristics ?? "—"}</dd></div>
            <div><dt>Operação</dt><dd>{machine.operatorCount ? `${machine.operatorCount} operador(es)` : "—"}</dd></div>
            <div><dt>Função dos operadores</dt><dd>{machine.operatorSkills ?? "—"}</dd></div>
            <div><dt>Identificação de riscos - Mecânico</dt><dd>{machine.mechMaintenanceSkills ?? "—"}</dd></div>
            <div><dt>Identificação de riscos - Elétrico</dt><dd>{machine.elecMaintenanceSkills ?? "—"}</dd></div>
          </dl></section>
          {machine.observations && <section className="machine-alert"><AlertTriangle size={19} /><div><strong>Observações</strong><p>{machine.observations}</p></div></section>}
          <section className="history-link" id="historico"><History size={17} /><span><strong>Histórico auditável</strong><small>Alterações registradas no banco</small></span><ChevronRight size={17} /></section>
        </aside>
      </div>
    </div>
  );
}
