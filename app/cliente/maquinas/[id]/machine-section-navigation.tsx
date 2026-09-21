"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const sections = [
  ["visao-geral", "Visão geral"],
  ["dados-tecnicos", "Dados técnicos"],
  ["fotos", "Fotos"],
  ["documentos", "Documentos"],
  ["apr", "Análise de risco"],
  ["checklist", "Checklist"],
  ["plano", "Plano de ação"],
  ["atividades", "Atividades"],
] as const;

export function MachineSectionNavigation() {
  const [active, setActive] = useState("visao-geral");

  useEffect(() => {
    const elements = sections.map(([id]) => document.getElementById(id)).filter((item): item is HTMLElement => Boolean(item));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target.id) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function goTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <>
      <nav className="detail-tabs" aria-label="Seções da máquina">{sections.map(([id, label]) => <a key={id} className={active === id ? "active" : ""} href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={(event) => { event.preventDefault(); goTo(id); }}>{label}</a>)}</nav>
      <label className="detail-section-select"><span>Seção da máquina</span><select value={active} onChange={(event) => goTo(event.target.value)}>{sections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><ChevronDown size={17} aria-hidden="true" /></label>
    </>
  );
}
