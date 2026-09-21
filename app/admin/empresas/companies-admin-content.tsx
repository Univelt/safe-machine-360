"use client";

import { Building2, CheckCircle2, ChevronRight, Globe2, MapPin, Plus, Search, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CompanyView } from "@/lib/data/types";
import { CompanyContextLink } from "@/app/components/company-context-link";

export function CompaniesAdminContent({ companies }: { companies: CompanyView[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = companies.filter((company) => !normalized || [company.name, company.legalName, company.cnpj, company.city].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized)));
  return <div className="dashboard admin-list-page"><div className="breadcrumb"><span>Administração</span><ChevronRight size={14} /><strong>Empresas</strong></div><section className="page-heading"><div><span className="eyebrow">Gestão de clientes</span><h1>Empresas da plataforma</h1><p>Cadastre clientes e vincule usuários e máquinas ao escopo correto.</p></div><Link className="button primary" href="/admin/empresas/nova"><Plus size={16} /> Cadastrar empresa</Link></section><div className="global-scope-note"><Globe2 size={18} /><span><strong>Esta área é global.</strong> A lista reúne todas as empresas da plataforma, independentemente do contexto selecionado.</span></div><section className="admin-list-toolbar"><label className="machine-search"><Search size={18} /><span className="sr-only">Buscar empresas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa, CNPJ ou cidade" /></label><span><strong>{filtered.length}</strong> empresas encontradas</span></section><section className="admin-company-grid">{filtered.map((company) => <article className="panel admin-company-card" key={company.id}><header><span className="admin-company-avatar"><Building2 size={19} /></span><div><strong>{company.name}</strong><small>{company.legalName}</small></div></header><div className="admin-company-card-location"><MapPin size={14} /> {company.city}<span>·</span>{company.cnpj}</div><dl><div><dt><Wrench size={14} /> Máquinas</dt><dd>{company.machines}</dd></div><div><dt><Users size={14} /> Usuários</dt><dd>{company.users}</dd></div><div><dt><CheckCircle2 size={14} /> Conformidade</dt><dd>{company.compliance}%</dd></div></dl><footer><div><span className={`admin-status ${company.status === "Ativa" ? "active" : "demo"}`}>{company.status}</span><span>{company.units} unidades · Gestor: {company.manager}</span></div><CompanyContextLink companyId={company.id} companyName={company.name} /></footer></article>)}</section></div>;
}
