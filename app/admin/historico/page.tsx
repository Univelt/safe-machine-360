import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/labels";

export const metadata: Metadata = { title: "Histórico | Administração" };

export default async function HistoryPage() {
  const logs = await prisma.auditLog.findMany({ include: { user: true, company: true }, orderBy: { createdAt: "desc" }, take: 80 });
  return (
    <AuthenticatedShell variant="admin">
      <div className="dashboard admin-list-page">
        <section className="page-heading"><div><span className="eyebrow">Auditoria</span><h1>Histórico de alterações</h1><p>Log de cadastros de máquinas, documentos, checklists e usuários.</p></div></section>
        <section className="panel admin-user-table">
          <div className="responsive-table">
            <table>
              <thead><tr><th>Quando</th><th>Ação</th><th>Entidade</th><th>Empresa</th><th>Resumo</th></tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>{log.action}</td>
                    <td>{log.entity}</td>
                    <td>{log.company?.name ?? "—"}</td>
                    <td>{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AuthenticatedShell>
  );
}
