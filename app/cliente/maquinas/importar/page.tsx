import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { MachineImportForm } from "./machine-import-form";
import { requireClient } from "@/lib/auth/guards";
import { canManageCompany, isSuperAdmin } from "@/lib/auth/session";
import { listCompanies } from "@/lib/data/machines";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Importar máquinas" };

export default async function ImportMachinesPage() {
  const session = await requireClient();
  if (!canManageCompany(session)) redirect("/cliente/maquinas");
  const [units, companies] = await Promise.all([
    prisma.unit.findMany({
      where: companyFilter(session),
      include: { company: { select: { name: true } } },
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
    }),
    isSuperAdmin(session) ? listCompanies() : Promise.resolve([]),
  ]);

  return (
    <AuthenticatedShell variant="client">
      <div className="dashboard record-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">NR-12</span>
            <h1>Importar planilha de máquinas</h1>
            <p>Envie a relação de máquinas, revise o que será cadastrado e confirme para gravar no banco.</p>
          </div>
          <Link className="button secondary" href="/cliente/maquinas">Voltar</Link>
        </section>
        <MachineImportForm
          isSuperAdmin={isSuperAdmin(session)}
          companies={companies.map((company) => ({ id: company.id, name: company.name }))}
          units={units.map((unit) => ({ id: unit.id, name: unit.name, companyId: unit.companyId, companyName: unit.company.name }))}
          defaultCompanyId={session.companyId}
        />
      </div>
    </AuthenticatedShell>
  );
}
