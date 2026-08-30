import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { createCompanyAction } from "@/app/actions/records";

export const metadata: Metadata = { title: "Cadastrar empresa" };

export default function NewCompanyPage() {
  return (
    <AuthenticatedShell variant="admin">
      <div className="dashboard record-page">
        <section className="page-heading"><div><span className="eyebrow">Clientes</span><h1>Cadastrar empresa</h1><p>Empresas isoladas: usuários e máquinas ficam vinculados a este CNPJ.</p></div><Link className="button secondary" href="/admin/empresas">Voltar</Link></section>
        <form className="panel record-form" action={createCompanyAction}>
          <label>Nome fantasia<input name="name" required /></label>
          <label>Razão social<input name="legalName" required /></label>
          <label>CNPJ<input name="cnpj" required /></label>
          <label>Cidade<input name="city" required /></label>
          <label>Gestor<input name="manager" required /></label>
          <label>Unidade inicial<input name="unitName" defaultValue="Matriz" /></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar empresa</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
