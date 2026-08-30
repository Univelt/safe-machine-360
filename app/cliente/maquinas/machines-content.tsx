"use client";

import { ChevronDown, ChevronRight, Filter, Plus, Search, SlidersHorizontal, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { MachineView } from "@/lib/data/types";
import { documentTone } from "@/lib/labels";

export function MachinesContent({ machines, companyName, canCreate }: { machines: MachineView[]; companyName: string; canCreate: boolean }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("Todos");
  const [sector, setSector] = useState("Todos");
  const [documentState, setDocumentState] = useState("Todos");
  const sectors = [...new Set(machines.map((machine) => machine.sector))].sort();
  const activeFilters = [risk, sector, documentState].filter((value) => value !== "Todos").length + (query ? 1 : 0);
  const filtered = machines.filter((machine) => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !normalized || [machine.name, machine.code, machine.tag, machine.manufacturer].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized));
    return matchesQuery && (risk === "Todos" || machine.risk === risk) && (sector === "Todos" || machine.sector === sector) && (documentState === "Todos" || machine.appreciation === documentState || machine.checklist === documentState);
  });

  function clearFilters() { setQuery(""); setRisk("Todos"); setSector("Todos"); setDocumentState("Todos"); }

  return (
    <div className="dashboard machines-page">
      <div className="breadcrumb"><span>{companyName}</span><ChevronRight size={14} /><strong>Máquinas</strong></div>
      <section className="page-heading">
        <div><span className="eyebrow">Parque de equipamentos</span><h1>Máquinas da empresa</h1><p>Consulte riscos, documentos e a situação de cada equipamento do seu escopo.</p></div>
        <div className="heading-actions">
          <div className="machine-summary"><strong>{machines.length}</strong><span>máquinas no escopo</span></div>
          {canCreate && <Link className="button primary" href="/cliente/maquinas/nova"><Plus size={16} /> Cadastrar máquina</Link>}
        </div>
      </section>

      <section className="machine-filter-panel" aria-label="Filtros de máquinas">
        <label className="machine-search"><Search size={18} /><span className="sr-only">Buscar máquinas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por máquina, código, TAG ou fabricante" /></label>
        <label className="filter-select"><span>Risco</span><select value={risk} onChange={(event) => setRisk(event.target.value)}><option>Todos</option><option>Muito baixo</option><option>Baixo</option><option>Significativo</option><option>Alto</option><option>Muito alto</option></select><ChevronDown size={15} /></label>
        <label className="filter-select"><span>Setor</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option>Todos</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
        <label className="filter-select"><span>Documentação</span><select value={documentState} onChange={(event) => setDocumentState(event.target.value)}><option>Todos</option><option>Em dia</option><option>A vencer</option><option>Vencido</option><option>Sem documento</option></select><ChevronDown size={15} /></label>
        <button className="button secondary filter-more" type="button"><SlidersHorizontal size={16} /> Mais filtros</button>
      </section>

      <div className="machine-results-bar"><span><Filter size={14} /><strong>{filtered.length}</strong> equipamentos encontrados {activeFilters > 0 && `· ${activeFilters} filtros ativos`}</span>{activeFilters > 0 && <button type="button" onClick={clearFilters}><X size={14} /> Limpar filtros</button>}</div>

      <section className="panel machine-list-panel">
        <div className="responsive-table"><table className="machine-list-table"><thead><tr><th>Equipamento</th><th>Setor</th><th>Fabricante</th><th>Nível de risco</th><th>Apreciação</th><th>Checklist</th><th>Status</th><th><span className="sr-only">Abrir</span></th></tr></thead>
          <tbody>{filtered.map((machine) => <tr key={machine.id}>
            <td><Link className="machine-cell" href={`/cliente/maquinas/${machine.id}`}><span className="machine-thumb"><Wrench size={18} /></span><span><strong>{machine.name}</strong><small>{machine.code} · {machine.tag}</small></span></Link></td>
            <td><strong className="table-primary">{machine.sector}</strong><small className="table-secondary">{machine.area}</small></td>
            <td><strong className="table-primary">{machine.manufacturer}</strong><small className="table-secondary">{machine.model}</small></td>
            <td><span className={`badge ${machine.riskTone}`}><span />{machine.risk}{machine.hrn ? ` · HRN ${machine.hrn}` : ""}</span></td>
            <td><span className={`doc-pill ${documentTone(machine.appreciation)}`}>{machine.appreciation}</span><small className="table-secondary">{machine.appreciationDate}</small></td>
            <td><span className={`doc-pill ${documentTone(machine.checklist)}`}>{machine.checklist}</span><small className="table-secondary">{machine.checklistDate}</small></td>
            <td><span className={`operation-status ${machine.status === "Operacional" ? "online" : machine.status === "Interditada" ? "blocked" : "maintenance"}`}><span />{machine.status}</span></td>
            <td><Link className="icon-button" href={`/cliente/maquinas/${machine.id}`} aria-label={`Abrir ${machine.name}`}><ChevronRight size={18} /></Link></td>
          </tr>)}</tbody>
        </table></div>
        {filtered.length === 0 && <div className="machine-empty"><Search size={28} /><strong>Nenhuma máquina encontrada</strong><p>Revise os filtros ou cadastre um novo equipamento.</p><button className="button secondary" type="button" onClick={clearFilters}>Limpar filtros</button></div>}
        <footer className="table-footer"><span>Exibindo {filtered.length} de {machines.length} máquinas</span></footer>
      </section>
    </div>
  );
}
