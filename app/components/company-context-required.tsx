import { Building2 } from "lucide-react";
import Link from "next/link";

export function CompanyContextRequired({ action }: { action: string }) {
  return (
    <div className="dashboard context-required-page">
      <section className="panel state-message">
        <Building2 size={30} />
        <strong>Selecione uma empresa para continuar</strong>
        <p>Para {action}, escolha a empresa no seletor do topo. Isso mantém o registro no escopo correto.</p>
        <Link className="button secondary" href="/admin/empresas">Ver empresas</Link>
      </section>
    </div>
  );
}
