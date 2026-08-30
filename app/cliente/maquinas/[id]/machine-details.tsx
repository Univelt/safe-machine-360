import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, Download, History, MapPin, Settings2, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import { MachinePhotos } from "./machine-photos";
import type { MachineView } from "@/lib/data/types";
import { categoryLabels, documentStatusLabels, documentTone, formatDate } from "@/lib/labels";

export function MachineDetails({ machine, canMutate }: { machine: MachineView; canMutate: boolean }) {
  const latestApr = machine.riskAssessments[0];
  const latestPlan = machine.actionPlans[0];
  const cover = machine.photos.find((photo) => photo.url);

  return (
    <div className="dashboard machine-details-page">
      <div className="breadcrumb"><span>{machine.companyName}</span><ChevronRight size={14} /><Link href="/cliente/maquinas">Máquinas</Link><ChevronRight size={14} /><strong>{machine.code}</strong></div>

      <section className="machine-hero">
        <div className="machine-hero-image">{cover?.url ? <img src={cover.url} alt={cover.caption} /> : <><Wrench size={38} /><span>Foto do equipamento</span></>}</div>
        <div className="machine-hero-copy"><div className="machine-hero-meta"><span className={`badge ${machine.riskTone}`}><span />{machine.risk}</span><span className={`operation-status ${machine.status === "Operacional" ? "online" : machine.status === "Interditada" ? "blocked" : "maintenance"}`}><span />{machine.status}</span></div><h1>{machine.name}</h1><p>{machine.code} · TAG {machine.tag} · Série {machine.serial}</p><div className="machine-location"><span><MapPin size={15} /> {machine.unitName} · {machine.sector} · {machine.area}</span><span><Settings2 size={15} /> {machine.manufacturer} · {machine.model}</span></div></div>
        {canMutate && <div className="machine-hero-actions"><Link className="button secondary" href={`/cliente/maquinas/${machine.id}/apr`}>Cadastrar APR</Link><Link className="button primary" href={`/cliente/documentos/novo?machineId=${machine.id}`}>Anexar documento</Link></div>}
      </section>

      <nav className="detail-tabs" aria-label="Seções da máquina"><a className="active" href="#visao-geral">Visão geral</a><a href="#dados-tecnicos">Dados técnicos</a><a href="#fotos">Fotos</a><a href="#documentos">Documentos</a><a href="#apr">Análise de risco</a><a href="#checklist">Checklist</a><a href="#plano">Plano de ação</a><a href="#atividades">Atividades</a></nav>

      <div className="detail-layout" id="visao-geral">
        <div className="detail-main-column">
          <section className="panel detail-section"><div className="panel-header"><div><span className="panel-kicker">Identificação</span><h2>Informações do equipamento</h2></div></div><div className="machine-description"><p>{machine.description}</p><dl>
            <div><dt>Código interno</dt><dd>{machine.code}</dd></div>
            <div><dt>Patrimônio/TAG</dt><dd>{machine.assetTag ?? machine.tag}</dd></div>
            <div><dt>Número de série</dt><dd>{machine.serial}</dd></div>
            <div><dt>Tipo</dt><dd>{machine.machineType ?? "—"}</dd></div>
            <div><dt>Fabricante</dt><dd>{machine.manufacturer}</dd></div>
            <div><dt>Modelo</dt><dd>{machine.model}</dd></div>
            <div><dt>Ano</dt><dd>{machine.year}</dd></div>
            <div><dt>Capacidade</dt><dd>{machine.capacity ?? "—"}</dd></div>
            <div><dt>Documento</dt><dd>{machine.documentNumber ?? "—"}</dd></div>
            <div><dt>Revisão</dt><dd>{machine.documentRevision ?? "—"}</dd></div>
          </dl></div></section>

          <MachinePhotos machine={machine} canMutate={canMutate} />

          <section className="panel detail-section" id="documentos"><div className="panel-header"><div><span className="panel-kicker">Controle documental</span><h2>Documentos vinculados à máquina</h2></div>{canMutate && <Link className="text-button" href={`/cliente/documentos/novo?machineId=${machine.id}`}>Anexar <ChevronRight size={16} /></Link>}</div>
            <div className="document-list">
              {machine.documents.length === 0 && <p className="empty-copy">Nenhum documento vinculado.</p>}
              {machine.documents.map((document) => (
                <article key={document.id}><span className={`document-file-icon ${documentTone(document.status)}`}><ShieldAlert size={19} /></span><div><strong>{document.name}</strong><small>{document.type} · Versão {document.version} · {document.size}</small></div><span><strong>{documentStatusLabels[document.status]}</strong><small>Validade: {document.expirationDate}</small></span><Link className="icon-button" href={`/cliente/documentos/${document.id}`} aria-label="Abrir documento"><Download size={17} /></Link></article>
              ))}
            </div>
          </section>

          <section className="panel detail-section" id="apr">
            <div className="panel-header"><div><span className="panel-kicker">Análise de risco</span><h2>APR da máquina</h2></div>{canMutate && <Link className="text-button" href={`/cliente/maquinas/${machine.id}/apr`}>Nova APR <ChevronRight size={16} /></Link>}</div>
            {latestApr ? (
              <dl className="spec-grid">
                <div><dt>Número do documento</dt><dd>{latestApr.documentNumber}</dd></div>
                <div><dt>Revisão</dt><dd>{latestApr.revision}</dd></div>
                <div><dt>Categoria</dt><dd>{categoryLabels[latestApr.category]}</dd></div>
                <div><dt>HRN atual</dt><dd>{latestApr.hrnCurrent}</dd></div>
                <div><dt>HRN residual</dt><dd>{latestApr.hrnResidual}</dd></div>
                <div><dt>Emissão</dt><dd>{formatDate(latestApr.issuedAt)}</dd></div>
              </dl>
            ) : <p className="empty-copy">Nenhuma APR cadastrada.</p>}
          </section>

          <section className="panel detail-section" id="checklist">
            <div className="panel-header"><div><span className="panel-kicker">Checklist NR-12</span><h2>Itens cadastrados no banco</h2></div>{canMutate && <Link className="text-button" href={`/cliente/maquinas/${machine.id}/checklist`}>Preencher checklist <ChevronRight size={16} /></Link>}</div>
            {machine.checklists.length === 0 && <p className="empty-copy">Nenhum checklist preenchido nesta máquina.</p>}
            {machine.checklists.map((execution) => (
              <div className="checklist-table" key={execution.id}>
                <header><span>Item</span><span>{execution.template.name}</span><span>Disponível e operante</span></header>
                {execution.answers.sort((a, b) => a.item.number - b.item.number).map((answer) => (
                  <div key={answer.id}><span>{answer.item.number}</span><span>{answer.item.description}</span><strong>{answer.result}</strong></div>
                ))}
                <p className="log-line">Log: executado em {formatDate(execution.executedAt)} por {execution.executedBy}.</p>
              </div>
            ))}
          </section>

          <section className="panel detail-section" id="plano">
            <div className="panel-header"><div><span className="panel-kicker">Plano de ação NR-12</span><h2>{latestPlan?.title ?? "Ações corretivas"}</h2></div>{canMutate && <Link className="text-button" href={`/cliente/maquinas/${machine.id}/plano`}>Novo plano <ChevronRight size={16} /></Link>}</div>
            {latestPlan ? (
              <div className="action-table">
                <header><span>N</span><span>Local</span><span>Não conformidade</span><span>Ação</span><span>Responsável</span></header>
                {latestPlan.items.map((item) => (
                  <div key={item.id}><span>{item.sequence}</span><span>{item.location}</span><span>{item.nonconformity}</span><span>{item.action}</span><strong>{item.responsible}</strong></div>
                ))}
              </div>
            ) : <p className="empty-copy">Nenhum plano de ação cadastrado.</p>}
          </section>

          <section className="panel detail-section" id="atividades"><div className="panel-header"><div><span className="panel-kicker">Acompanhamento</span><h2>Atividades da máquina</h2></div></div><div className="machine-timeline">
            {machine.activities.length === 0 && <p className="empty-copy">Nenhuma atividade vinculada.</p>}
            {machine.activities.map((activity) => (
              <div key={activity.id}><span className={`timeline-dot ${activity.status === "CONCLUIDA" ? "completed" : "pending"}`}>{activity.status === "CONCLUIDA" ? <CheckCircle2 size={15} /> : <CalendarClock size={15} />}</span><article><strong>{activity.title}</strong><p>{activity.responsible} · prazo {formatDate(activity.dueDate)}</p><small>{activity.responsibleEmail ?? "Sem e-mail cadastrado"}</small></article></div>
            ))}
          </div></section>
        </div>

        <aside className="detail-side-column">
          <section className="panel risk-summary"><div className="panel-header"><div><span className="panel-kicker">Avaliação de risco</span><h2>Classificação atual</h2></div></div><div className="risk-number"><ShieldAlert size={26} /><strong>{machine.hrn}</strong><span>HRN atual</span></div><dl><div><dt>Nível</dt><dd><span className={`badge ${machine.riskTone}`}><span />{machine.risk}</span></dd></div><div><dt>HRN residual</dt><dd>{machine.hrnResidual ?? "—"}</dd></div><div><dt>Categoria</dt><dd>{machine.category ? categoryLabels[machine.category] : "—"}</dd></div><div><dt>Situação NR-12</dt><dd>{machine.status === "Interditada" ? "Adequação necessária" : "Monitorada"}</dd></div></dl></section>
          <section className="panel quick-facts" id="dados-tecnicos"><div className="panel-header"><div><span className="panel-kicker">Limites do equipamento</span><h2>Características</h2></div></div><dl>
            <div><dt>Fontes de energia</dt><dd>{machine.energy}</dd></div>
            <div><dt>Sistemas</dt><dd>{machine.mainSystems ?? "—"}</dd></div>
            <div><dt>Utilização</dt><dd>{machine.usage ?? "—"}</dd></div>
            <div><dt>Processo</dt><dd>{machine.processCharacteristics ?? "—"}</dd></div>
            <div><dt>Operação</dt><dd>{machine.operatorCount ? `${machine.operatorCount} operador(es)` : "—"}</dd></div>
            <div><dt>Habilidades</dt><dd>{machine.operatorSkills ?? "—"}</dd></div>
            <div><dt>Manutenção mecânica</dt><dd>{machine.mechMaintenanceSkills ?? "—"}</dd></div>
            <div><dt>Manutenção elétrica</dt><dd>{machine.elecMaintenanceSkills ?? "—"}</dd></div>
          </dl></section>
          {machine.observations && <section className="machine-alert"><AlertTriangle size={19} /><div><strong>Observações</strong><p>{machine.observations}</p></div></section>}
          <section className="history-link" id="historico"><History size={17} /><span><strong>Histórico auditável</strong><small>Alterações registradas no banco</small></span><ChevronRight size={17} /></section>
        </aside>
      </div>
    </div>
  );
}
