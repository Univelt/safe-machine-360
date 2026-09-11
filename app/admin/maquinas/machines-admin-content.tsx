"use client";

import { ChevronDown, ChevronRight, Plus, Search, Upload, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { paginateItems, TablePagination } from "@/app/components/table-pagination";
import type { MachineView } from "@/lib/data/types";
import { documentTone } from "@/lib/labels";
import { RiskBadge } from "@/app/components/risk-badge";

export function MachinesAdminContent({ machines }: { machines: MachineView[] }) {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("Todas");
  const [page, setPage] = useState(1);
  const companies = [...new Set(machines.map((machine) => machine.companyName))];
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const rows = machines.filter((machine) => (
    (!normalized || [machine.name, machine.code, machine.tag, machine.companyName].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized)))
    && (company === "Todas" || machine.companyName === company)
  ));
  const paged = paginateItems(rows, page);

  function goToPage(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
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
      <section className="admin-user-toolbar">
        <label className="machine-search"><Search size={18} /><span className="sr-only">Buscar máquinas</span><input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Buscar máquina, código, TAG ou empresa" /></label>
        <label className="filter-select"><span>Empresa</span><select value={company} onChange={(event) => updateFilter(setCompany, event.target.value)}><option>Todas</option>{companies.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
      </section>
      <section className="panel admin-user-table">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Equipamento</th><th>Empresa</th><th>Setor</th><th>Risco</th><th>Documentação</th><th>Status</th></tr></thead>
            <tbody>{paged.items.map((machine) => (
              <tr key={machine.id}>
                <td><Link className="machine-cell" href={`/cliente/maquinas/${machine.id}`}><span className="machine-thumb"><Wrench size={18} /></span><span><strong>{machine.name}</strong><small>{machine.code} · {machine.tag}</small></span></Link></td>
                <td><strong className="table-primary">{machine.companyName}</strong></td>
                <td>{machine.sector}</td>
                <td><RiskBadge level={machine.riskLevel} /></td>
                <td><span className={`doc-pill ${documentTone(machine.appreciation)}`}>{machine.appreciation}</span></td>
                <td><span className={`operation-status ${machine.status === "Operacional" ? "online" : machine.status === "Interditada" ? "blocked" : "maintenance"}`}><span />{machine.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <TablePagination from={paged.from} to={paged.to} total={paged.total} page={paged.page} totalPages={paged.totalPages} onPageChange={goToPage} />
      </section>
    </div>
  );
}
