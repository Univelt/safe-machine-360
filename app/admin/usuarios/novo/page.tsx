import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { createUserAction } from "@/app/actions/records";
import { listCompanies } from "@/lib/data/machines";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Convidar usuário" };

export default async function NewUserPage() {
  await requireAdmin();
  const companies = await listCompanies();
  return (
    <AuthenticatedShell variant="admin">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Acessos</span><h1>Cadastrar usuário</h1><p>Super Admin vê tudo. Demais perfis precisam de uma empresa para enxergar só as máquinas dela.</p></div><Link className="button secondary" href="/admin/usuarios">Voltar</Link></section>
        <form className="panel record-form" action={createUserAction}>
          <label>Nome<input name="name" required /></label>
          <label>E-mail<input name="email" type="email" required /></label>
          <label>Senha inicial<input name="password" type="password" required minLength={8} /></label>
          <label>Perfil<select name="role"><option value="CLIENT_ADMIN">Admin Cliente</option><option value="CLIENT_MANAGER">Gestor Cliente</option><option value="VIEWER">Visualizador</option><option value="SUPER_ADMIN">Super Admin Univelt</option></select></label>
          <label className="full">Empresa<select name="companyId"><option value="">Univelt (somente Super Admin)</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar usuário</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
