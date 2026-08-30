"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Cloud,
  Database,
  FileCheck2,
  FileSpreadsheet,
  Fingerprint,
  Gauge,
  Layers3,
  LockKeyhole,
  Maximize2,
  MonitorSmartphone,
  Network,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Brand } from "../components/brand";

const slideNames = [
  "Visão",
  "Desafio",
  "Experiência",
  "Jornada",
  "Segurança",
  "Arquitetura",
  "Evolução",
  "Próximo passo",
];

export function PresentationDeck() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastSlide = slideNames.length - 1;

  const goTo = useCallback((index: number) => {
    setActiveSlide(Math.max(0, Math.min(lastSlide, index)));
  }, [lastSlide]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setActiveSlide((current) => Math.min(lastSlide, current + 1));
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setActiveSlide((current) => Math.max(0, current - 1));
      }
      if (event.key === "Home") setActiveSlide(0);
      if (event.key === "End") setActiveSlide(lastSlide);
    }
    function handleFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [lastSlide]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  return (
    <main className="presentation-shell">
      <header className="presentation-header">
        <Brand href="/apresentacao" />
        <div className="presentation-mode"><Presentation size={15} /> Apresentação executiva</div>
        <div className="presentation-header-actions">
          <span>Conceito em desenvolvimento</span>
          <button type="button" className="presentation-icon-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"}>
            <Maximize2 size={18} />
          </button>
          <Link className="presentation-icon-button" href="/" aria-label="Fechar apresentação"><X size={20} /></Link>
        </div>
      </header>

      <aside className="presentation-rail" aria-label="Seções da apresentação">
        <span className="rail-line" aria-hidden="true" />
        {slideNames.map((name, index) => (
          <button
            key={name}
            type="button"
            className={activeSlide === index ? "active" : ""}
            onClick={() => goTo(index)}
            aria-label={`Ir para ${name}`}
            aria-current={activeSlide === index ? "step" : undefined}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <small>{name}</small>
          </button>
        ))}
      </aside>

      <section className="presentation-stage" aria-live="polite">
        <div key={activeSlide} className="presentation-slide">
          {activeSlide === 0 && <VisionSlide />}
          {activeSlide === 1 && <ChallengeSlide />}
          {activeSlide === 2 && <ExperienceSlide />}
          {activeSlide === 3 && <JourneySlide />}
          {activeSlide === 4 && <SecuritySlide />}
          {activeSlide === 5 && <ArchitectureSlide />}
          {activeSlide === 6 && <RoadmapSlide />}
          {activeSlide === 7 && <ClosingSlide />}
        </div>
      </section>

      <footer className="presentation-footer">
        <div className="presentation-progress" aria-label={`Etapa ${activeSlide + 1} de ${slideNames.length}`}>
          <span style={{ width: `${((activeSlide + 1) / slideNames.length) * 100}%` }} />
        </div>
        <span className="presentation-count">{String(activeSlide + 1).padStart(2, "0")} <small>/ {String(slideNames.length).padStart(2, "0")}</small></span>
        <div className="presentation-controls">
          <button type="button" onClick={() => goTo(activeSlide - 1)} disabled={activeSlide === 0} aria-label="Slide anterior"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => goTo(activeSlide + 1)} disabled={activeSlide === lastSlide} aria-label="Próximo slide"><ArrowRight size={18} /></button>
        </div>
      </footer>
    </main>
  );
}

function SlideHeading({ number, eyebrow, title, text }: { number: string; eyebrow: string; title: string; text: string }) {
  return (
    <div className="slide-heading">
      <span className="slide-number">{number}</span>
      <span className="slide-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function VisionSlide() {
  return (
    <div className="vision-slide slide-layout">
      <div className="vision-copy">
        <div className="presentation-tag"><Sparkles size={15} /> Portal Univelt Machine Safety</div>
        <h1>Um novo padrão para a gestão de <span>segurança de máquinas.</span></h1>
        <p>Da planilha fragmentada para uma visão centralizada, segura e preparada para grandes operações industriais.</p>
        <div className="vision-actions">
          <span><CheckCircle2 size={16} /> Multiempresa por princípio</span>
          <span><CheckCircle2 size={16} /> Rastreabilidade completa</span>
          <span><CheckCircle2 size={16} /> Pronto para Azure ou AWS</span>
        </div>
      </div>
      <div className="portal-preview" aria-label="Prévia conceitual do dashboard">
        <div className="preview-top"><span /><span /><span /><strong>portal.univelt.com.br</strong></div>
        <div className="preview-app">
          <div className="preview-sidebar">
            <span className="preview-brand">U</span>
            <i className="on" /><i /><i /><i /><i />
          </div>
          <div className="preview-content">
            <div className="preview-welcome"><div><small>PAINEL OPERACIONAL</small><strong>Visão geral de segurança</strong></div><span>Dados demonstrativos</span></div>
            <div className="preview-metrics"><article><small>Máquinas</small><strong>248</strong></article><article><small>Risco alto</small><strong>31</strong></article><article><small>A vencer</small><strong>22</strong></article></div>
            <div className="preview-panels"><article><div className="mini-donut" /><span>Risco por categoria</span></article><article><strong>86%</strong><span>em conformidade</span><i /><i /><i /></article></div>
          </div>
        </div>
        <span className="preview-note">Cenário visual demonstrativo</span>
      </div>
    </div>
  );
}

function ChallengeSlide() {
  const problems = [
    { icon: FileSpreadsheet, title: "Informação dispersa", text: "Planilhas, links e documentos sem uma visão consolidada." },
    { icon: Search, title: "Consulta demorada", text: "Localizar uma máquina ou validade depende de filtros manuais." },
    { icon: FileCheck2, title: "Validades pouco visíveis", text: "Risco de documentos vencidos serem percebidos tarde demais." },
    { icon: Network, title: "Escala limitada", text: "Centenas de máquinas e múltiplas unidades exigem governança." },
  ];
  return (
    <div className="challenge-slide">
      <SlideHeading number="01" eyebrow="O ponto de partida" title="A operação cresceu. A informação precisa acompanhar." text="O desafio não é apenas digitalizar uma planilha. É transformar dados técnicos em uma experiência de gestão confiável." />
      <div className="challenge-grid">
        {problems.map(({ icon: Icon, title, text }, index) => <article key={title}><span>0{index + 1}</span><Icon size={24} /><h2>{title}</h2><p>{text}</p></article>)}
      </div>
      <div className="challenge-outcome"><span>Antes</span><strong>Dados disponíveis</strong><ChevronRight size={20} /><span>Com o portal</span><strong>Decisões orientadas por contexto</strong></div>
    </div>
  );
}

function ExperienceSlide() {
  return (
    <div className="experience-slide">
      <SlideHeading number="02" eyebrow="Uma plataforma, diferentes visões" title="A experiência certa para cada organização." text="A Univelt mantém a governança central. Cada cliente acessa exclusivamente sua própria operação." />
      <div className="tenant-visual">
        <div className="tenant-center"><span className="tenant-logo-large">U</span><strong>UNIVELT</strong><small>Administração central</small></div>
        <div className="tenant-orbit tenant-a"><span>ID</span><strong>Indústria Delta</strong><small>248 máquinas</small></div>
        <div className="tenant-orbit tenant-b"><span>AP</span><strong>Atlas Packaging</strong><small>96 máquinas</small></div>
        <div className="tenant-orbit tenant-c"><span>FB</span><strong>Fábrica Boreal</strong><small>174 máquinas</small></div>
        <i className="orbit-line line-a" /><i className="orbit-line line-b" /><i className="orbit-line line-c" />
      </div>
      <div className="experience-principles">
        <div><LockKeyhole size={20} /><span><strong>Dados segregados</strong><small>Proteção aplicada também no banco.</small></span></div>
        <div><Users size={20} /><span><strong>Perfis de acesso</strong><small>Cada usuário vê e faz apenas o necessário.</small></span></div>
        <div><Building2 size={20} /><span><strong>Escala multiempresa</strong><small>Novos clientes sem duplicar a plataforma.</small></span></div>
      </div>
    </div>
  );
}

function JourneySlide() {
  const steps = [
    { icon: Gauge, label: "Perceber", title: "Indicador sinaliza a prioridade", meta: "22 documentos a vencer" },
    { icon: Search, label: "Localizar", title: "Filtro encontra a máquina", meta: "Unidade · Setor · Risco" },
    { icon: Wrench, label: "Compreender", title: "Detalhe reúne todo o contexto", meta: "Dados · Fotos · Histórico" },
    { icon: ClipboardCheck, label: "Agir", title: "Atividade orienta a correção", meta: "Responsável · Prazo · Evidência" },
  ];
  return (
    <div className="journey-slide">
      <SlideHeading number="03" eyebrow="Experiência operacional" title="Do indicador ao documento em poucos cliques." text="O portal organiza uma jornada simples: perceber, localizar, compreender e agir." />
      <div className="journey-flow">
        {steps.map(({ icon: Icon, label, title, meta }, index) => (
          <article key={label}><span className="journey-step">{index + 1}</span><div className="journey-icon"><Icon size={25} /></div><small>{label}</small><h2>{title}</h2><p>{meta}</p>{index < steps.length - 1 && <ArrowRight className="journey-arrow" size={22} />}</article>
        ))}
      </div>
      <div className="journey-benefit"><BarChart3 size={22} /><p><strong>Resultado esperado</strong> Menos tempo procurando informações e mais clareza para priorizar ações de segurança.</p></div>
    </div>
  );
}

function SecuritySlide() {
  const controls = ["Isolamento por empresa", "Autorização no servidor", "Row Level Security", "Arquivos privados", "Auditoria e rastreabilidade", "Princípio do menor privilégio"];
  return (
    <div className="security-slide">
      <div>
        <SlideHeading number="04" eyebrow="Segurança desde a arquitetura" title="Proteção real, não apenas uma camada visual." text="O cliente não depende de um filtro na interface para manter seus dados privados. A separação é validada em todas as camadas." />
        <div className="security-controls">{controls.map((control) => <span key={control}><CheckCircle2 size={15} />{control}</span>)}</div>
      </div>
      <div className="security-core">
        <div className="security-ring ring-three"><span>Interface</span></div>
        <div className="security-ring ring-two"><span>Aplicação</span></div>
        <div className="security-ring ring-one"><span>Banco</span></div>
        <div className="security-shield"><ShieldCheck size={46} /><strong>Tenant</strong><small>isolado</small></div>
        <div className="security-proof"><Fingerprint size={18} /><span><strong>Critério de aceite</strong> Testes automatizados comprovam que a empresa A não acessa os dados da empresa B.</span></div>
      </div>
    </div>
  );
}

function ArchitectureSlide() {
  return (
    <div className="architecture-slide">
      <SlideHeading number="05" eyebrow="Arquitetura preparada para evoluir" title="Começar simples. Crescer sem reconstruir." text="Um monólito modular reduz a complexidade inicial e preserva caminhos claros para Azure ou AWS." />
      <div className="architecture-map">
        <div className="architecture-layer front"><MonitorSmartphone size={23} /><span><strong>Experiência web</strong><small>Next.js · React · TypeScript</small></span></div>
        <ChevronRight size={24} />
        <div className="architecture-layer core"><Layers3 size={23} /><span><strong>Núcleo modular</strong><small>Regras, casos de uso e permissões</small></span></div>
        <ChevronRight size={24} />
        <div className="architecture-layer data"><Database size={23} /><span><strong>Dados e arquivos</strong><small>PostgreSQL · Storage privado</small></span></div>
      </div>
      <div className="cloud-options">
        <div className="cloud-lead"><Cloud size={27} /><span><strong>Portabilidade planejada</strong><small>Serviços externos acessados por adaptadores.</small></span></div>
        <article><span className="cloud-mark azure">A</span><div><strong>Microsoft Azure</strong><small>Container Apps · PostgreSQL · Blob Storage</small></div></article>
        <article><span className="cloud-mark aws">AWS</span><div><strong>Amazon Web Services</strong><small>ECS Fargate · RDS · S3</small></div></article>
      </div>
      <p className="architecture-note">A escolha do provedor pode acontecer no momento certo, sem comprometer o desenho do produto agora.</p>
    </div>
  );
}

function RoadmapSlide() {
  const phases = [
    { phase: "01", title: "Fundação visual", text: "Identidade, navegação, login e dashboard demonstrativo.", status: "Concluída" },
    { phase: "02", title: "Segurança multiempresa", text: "Banco, autenticação, perfis, RLS e testes de isolamento.", status: "Próxima" },
    { phase: "03", title: "Máquinas", text: "Consulta, filtros, cadastro e página detalhada.", status: "Planejada" },
    { phase: "04", title: "Documentos e fotos", text: "Storage privado, validades, upload e galeria.", status: "Planejada" },
    { phase: "05–07", title: "Operação e escala", text: "Atividades, auditoria, indicadores e prontidão cloud.", status: "Evolução" },
  ];
  return (
    <div className="roadmap-slide">
      <SlideHeading number="06" eyebrow="Desenvolvimento responsável" title="Evolução por etapas, com evidência a cada entrega." text="Cada fase produz uma parte utilizável, passa por validação e só então abre caminho para a próxima." />
      <div className="roadmap-line">
        {phases.map((item, index) => <article key={item.phase} className={index === 0 ? "done" : index === 1 ? "next" : ""}><span className="roadmap-dot"><CheckCircle2 size={index === 0 ? 18 : 0} /></span><small>FASE {item.phase}</small><h2>{item.title}</h2><p>{item.text}</p><strong>{item.status}</strong></article>)}
      </div>
      <div className="roadmap-rule"><ShieldCheck size={20} /><span><strong>Portão de qualidade</strong> Nenhuma fase avança sem build, tipos, testes, documentação e riscos registrados.</span></div>
    </div>
  );
}

function ClosingSlide() {
  return (
    <div className="closing-slide slide-layout">
      <div>
        <span className="closing-kicker">Portal Univelt Machine Safety</span>
        <h1>Transformar informação técnica em <span>confiança operacional.</span></h1>
        <p>A fundação visual está pronta para validação. O próximo passo é conectar a experiência a uma base multiempresa segura.</p>
        <div className="closing-next"><span>Próxima decisão</span><strong>Aprovar identidade visual e iniciar a Fase 2</strong></div>
        <div className="closing-actions"><Link href="/" className="closing-primary">Abrir painel demonstrativo <ArrowRight size={18} /></Link><Link href="/login" className="closing-secondary">Ver acesso do cliente</Link></div>
      </div>
      <div className="closing-summary">
        <span className="summary-orbit orbit-one" /><span className="summary-orbit orbit-two" />
        <div className="summary-core"><span>U</span><strong>UNIVELT</strong><small>Machine Safety</small></div>
        <div className="summary-item item-one"><ShieldCheck size={19} /><span><strong>Seguro</strong><small>por princípio</small></span></div>
        <div className="summary-item item-two"><Gauge size={19} /><span><strong>Claro</strong><small>para decidir</small></span></div>
        <div className="summary-item item-three"><Cloud size={19} /><span><strong>Escalável</strong><small>para crescer</small></span></div>
      </div>
    </div>
  );
}
