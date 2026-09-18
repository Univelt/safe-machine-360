"use client";

import { ChevronDown, ChevronRight, Filter, Plus, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { paginateItems, TablePagination } from "@/app/components/table-pagination";
import { MachineThumbnail } from "@/app/components/machine-thumbnail";
import type { MachineView } from "@/lib/data/types";
import { documentTone } from "@/lib/labels";
import { RiskBadge } from "@/app/components/risk-badge";
import { countActiveMachineFilters, filterMachines, type MachineSortOrder } from "@/lib/machine-filters";

export function MachinesAdminContent({ machines }: { machines: MachineView[] }) {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("all");
  const [sector, setSector] = useState("Todos");
  const [risk, setRisk] = useState("Todos");
  const [documentation, setDocumentation] = useState("Todos");
  const [sort, setSort] = useState<MachineSortOrder>("default");
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(1);
  const companies = [...new Set(machines.map((machine) => machine.companyName))].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  const sectors = [...new Set(machines.map((machine) => machine.sector))].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  const risks = [...new Set(machines.map((machine) => machine.risk))].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  const activeFilters = countActiveMachineFilters({ query, company, sector, risk, documentation, sort });
  const rows = filterMachines(machines, { query, company, sector, risk, documentation, sort });
  const paged = paginateItems(rows, page);

  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setCompany("all");
    setSector("Todos");
    setRisk("Todos");
    setDocumentation("Todos");
    setSort("default");
    setShowMore(false);
    setPage(1);
  }

  return (
    <div className="dashboard admin-list-page">
      <div className="breadcrumb"><span>Administração</span><ChevronRight size={14} /><strong>Máquinas</strong></div>
      <section className="page-heading">
        <div><span className="eyebrow">Parque multiempresa</span><h1>Máquinas de todos os clientes</h1><p>O administrador Univelt consulta o inventário global. Cada cliente vê apenas a própria empresa.</p></div>
        <div className="heading-actions">
          <Link className="button secondary" href="/cliente/maquinas/importar"><Upload size={16} /> Importar planilha</Link>
          <Link className="button primary" href="/cliente/maquinas/nova"><Plus size={16} /> Cadastrar máquina</Link>
        </div>
      </section>
      <section className="machine-filter-panel admin-machine-filter-panel" aria-label="Filtros de máquinas">
        <label className="machine-search"><Search size={18} /><span className="sr-only">Buscar máquinas</span><input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Buscar máquina, código, TAG ou empresa" /></label>
        <label className="filter-select"><span>Empresa</span><select value={company} onChange={(event) => updateFilter(setCompany, event.target.value)}><option value="all">Todas</option>{companies.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
        <label className="filter-select"><span>Setor</span><select value={sector} onChange={(event) => updateFilter(setSector, event.target.value)}><option>Todos</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
        <label className="filter-select"><span>Risco</span><select value={risk} onChange={(event) => updateFilter(setRisk, event.target.value)}><option>Todos</option>{risks.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
        <label className="filter-select"><span>Documentação</span><select value={documentation} onChange={(event) => updateFilter(setDocumentation, event.target.value)}><option>Todos</option><option>Em dia</option><option>A vencer</option><option>Sem documento</option></select><ChevronDown size={15} /></label>
        <button className="button secondary filter-more" type="button" aria-expanded={showMore} aria-controls={showMore ? "admin-machine-extra-filters" : undefined} onClick={() => setShowMore((shown) => !shown)}><SlidersHorizontal size={16} /> Mais filtros</button>
        {showMore && <label className="filter-select machine-extra-filter" id="admin-machine-extra-filters"><span>Ordem alfabética</span><select value={sort} onChange={(event) => updateFilter(setSort, event.target.value as MachineSortOrder)}><option value="default">Padrão</option><option value="az">A a Z</option><option value="za">Z a A</option></select><ChevronDown size={15} /></label>}
      </section>
      <div className="machine-results-bar"><span><Filter size={14} /><strong>{rows.length}</strong> equipamentos encontrados {activeFilters > 0 && `· ${activeFilters} filtros ativos`}</span>{activeFilters > 0 && <button type="button" onClick={clearFilters}><X size={14} /> Limpar filtros</button>}</div>
      <section className="panel admin-user-table">
        {rows.length > 0 ? <div className="responsive-table">
          <table className="machine-list-table">
            <thead><tr><th>Equipamento</th><th>Empresa</th><th>Setor</th><th>Risco</th><th>Documentação</th><th>Status</th><th><span className="sr-only">Abrir</span></th></tr></thead>
            <tbody>{paged.items.map((machine) => (
              <tr key={machine.id}>
                <td><Link className="machine-cell" href={`/cliente/maquinas/${machine.id}`}><MachineThumbnail photos={machine.photos} /><span><strong>{machine.name}</strong><small>{machine.code} · {machine.tag}</small></span></Link></td>
                <td><strong className="table-primary">{machine.companyName}</strong></td>
                <td>{machine.sector}</td>
                <td><RiskBadge level={machine.riskLevel} hrn={machine.hrn} /></td>
                <td><div className="admin-machine-docs"><span className={`doc-pill ${documentTone(machine.appreciation)}`}>APR: {machine.appreciation}</span><span className={`doc-pill ${documentTone(machine.checklist)}`}>Checklist: {machine.checklist}</span></div></td>
                <td><span className={`operation-status ${machine.status === "Operacional" ? "online" : machine.status === "Interditada" ? "blocked" : "maintenance"}`}><span />{machine.status}</span></td>
                <td><Link className="icon-button" href={`/cliente/maquinas/${machine.id}`} aria-label={`Abrir ${machine.name}`}><ChevronRight size={18} /></Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div> : <div className="machine-empty"><Search size={28} /><strong>Nenhuma máquina encontrada</strong><p>Revise os filtros ou limpe a busca para ver os equipamentos.</p><button className="button secondary" type="button" onClick={clearFilters}>Limpar filtros</button></div>}
        <TablePagination from={paged.from} to={paged.to} total={paged.total} page={paged.page} totalPages={paged.totalPages} onPageChange={goToPage} />
      </section>
    </div>
  );
}
