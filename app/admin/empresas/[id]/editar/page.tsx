import { updateCompanyAction } from "@/app/actions/safe-records";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { SafeForm } from "@/app/components/safe-form";
import { AuthenticatedShell } from "../../../../components/authenticated-shell";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Editar empresa | Administração" };

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  return (
    <AuthenticatedShell variant="admin">
      <div className="dashboard record-page">
        <section className="page-heading">
          <div><span className="eyebrow">Gestão de clientes</span><h1>Editar empresa</h1><p>Atualize os dados cadastrais. Os usuários, máquinas e unidades vinculados serão preservados.</p></div>
          <Link className="button secondary" href="/admin/empresas">Voltar</Link>
        </section>
        <SafeForm className="panel record-form" action={updateCompanyAction}>
          <input type="hidden" name="companyId" value={company.id} />
          <label>Nome fantasia<input name="name" required defaultValue={company.name} /></label>
          <label>Razão social<input name="legalName" required defaultValue={company.legalName} /></label>
          <label>CNPJ<input name="cnpj" required defaultValue={company.cnpj} /></label>
          <label>Cidade<input name="city" required defaultValue={company.city} /></label>
          <label>Gestor<input name="manager" required defaultValue={company.manager} /></label>
          <div className="form-actions"><button className="button primary" type="submit">Salvar alterações</button></div>
        </SafeForm>
      </div>
    </AuthenticatedShell>
  );
}
