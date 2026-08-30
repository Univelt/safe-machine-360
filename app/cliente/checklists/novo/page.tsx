import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { createChecklistTemplateAction } from "@/app/actions/records";
import { requireClient } from "@/lib/auth/guards";
import { isSuperAdmin } from "@/lib/auth/session";
import { listCompanies } from "@/lib/data/machines";
import { ChecklistItemsEditor } from "../checklist-items-editor";

export const metadata: Metadata = { title: "Novo checklist" };

export default async function NewChecklistTemplatePage() {
  const session = await requireClient();
  const companies = isSuperAdmin(session) ? await listCompanies() : [];
  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Catálogo NR-12</span>
            <h1>Cadastrar checklist</h1>
            <p>Os itens entram na tabela do banco e passam a aparecer no preenchimento da máquina.</p>
          </div>
          <Link className="button secondary" href="/cliente/checklists">Voltar</Link>
        </section>
        <form className="panel record-form" action={createChecklistTemplateAction}>
          <label className="full">Nome do checklist<input name="name" required placeholder="Check list preliminar de segurança – NR 12" /></label>
          {isSuperAdmin(session) && (
            <label className="full">Empresa
              <select name="companyId">
                <option value="">Catálogo global (todas as empresas)</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
          )}
          <label className="full">Descrição<textarea name="description" rows={3} placeholder="Para que este checklist é usado" /></label>
          <div className="full">
            <p className="eyebrow">Itens de verificação</p>
            <ChecklistItemsEditor />
          </div>
          <div className="form-actions"><button className="button primary" type="submit">Salvar checklist</button></div>
        </form>
      </div>
    </AuthenticatedShell>
  );
}
