"use client";

import { ChevronDown, ChevronRight, Plus, Search, ShieldCheck, UserCheck, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDate, initialsOf, roleLabels } from "@/lib/labels";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof roleLabels;
  status: string;
  lastAccessAt: Date | null;
  companyName: string;
};

export function UsersAdminContent({ users, metrics }: { users: UserRow[]; metrics: { activeUsers: number; adminUsers: number; invitedUsers: number } }) {
  const [query, setQuery] = useState(""); const [company, setCompany] = useState("Todas"); const [role, setRole] = useState("Todos");
  const companies = [...new Set(users.map((user) => user.companyName))];
  const filtered = users.filter((user) => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return (!normalized || [user.name, user.email, user.companyName].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized))) && (company === "Todas" || user.companyName === company) && (role === "Todos" || roleLabels[user.role] === role);
  });
  return <div className="dashboard admin-list-page"><div className="breadcrumb"><span>Administração</span><ChevronRight size={14} /><strong>Usuários</strong></div><section className="page-heading"><div><span className="eyebrow">Acessos e permissões</span><h1>Usuários da plataforma</h1><p>Admin vê tudo. Usuário cliente fica vinculado a uma empresa e só acessa as máquinas dela.</p></div><Link className="button primary" href="/admin/usuarios/novo"><UserRoundPlus size={16} /> Convidar usuário</Link></section><section className="admin-user-metrics"><article><span><UserCheck size={19} /></span><div><strong>{metrics.activeUsers}</strong><small>Usuários ativos</small></div></article><article><span><ShieldCheck size={19} /></span><div><strong>{metrics.adminUsers}</strong><small>Administradores</small></div></article><article><span><Plus size={19} /></span><div><strong>{metrics.invitedUsers}</strong><small>Convites pendentes</small></div></article></section><section className="admin-user-toolbar"><label className="machine-search"><Search size={18} /><span className="sr-only">Buscar usuários</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou empresa" /></label><label className="filter-select"><span>Empresa</span><select value={company} onChange={(event) => setCompany(event.target.value)}><option>Todas</option>{companies.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label><label className="filter-select"><span>Perfil</span><select value={role} onChange={(event) => setRole(event.target.value)}><option>Todos</option><option>Super Admin Univelt</option><option>Admin Cliente</option><option>Gestor Cliente</option><option>Visualizador</option></select><ChevronDown size={15} /></label></section><section className="panel admin-user-table"><div className="responsive-table"><table><thead><tr><th>Usuário</th><th>Empresa</th><th>Perfil</th><th>Situação</th><th>Último acesso</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><div className="admin-user-cell"><span>{initialsOf(user.name)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td><td><strong className="table-primary">{user.companyName}</strong></td><td><span className="admin-role">{roleLabels[user.role]}</span></td><td><span className={`admin-status ${user.status === "ACTIVE" ? "active" : "pending"}`}>{user.status === "ACTIVE" ? "Ativo" : user.status === "INVITED" ? "Convite pendente" : "Inativo"}</span></td><td>{formatDate(user.lastAccessAt)}</td></tr>)}</tbody></table></div><footer className="table-footer"><span>Exibindo {filtered.length} usuários</span></footer></section></div>;
}
