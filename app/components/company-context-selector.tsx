"use client";

import { Building2, ChevronDown, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CompanyOption = { id: string; name: string };

export function CompanyContextSelector({
  companies,
  activeCompanyId,
}: {
  companies: CompanyOption[];
  activeCompanyId: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function changeContext(companyId: string) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: companyId || null }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Não foi possível alterar o contexto.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível alterar o contexto.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="context-selector-wrap">
      <label className="context-selector">
        <Building2 size={16} aria-hidden="true" />
        <span className="sr-only">Contexto da empresa</span>
        <select
          value={activeCompanyId ?? ""}
          onChange={(event) => changeContext(event.target.value)}
          disabled={pending}
          aria-describedby={error ? "context-error" : undefined}
        >
          <option value="">Todas as empresas</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
        {pending ? <LoaderCircle className="spin" size={16} /> : <ChevronDown size={16} aria-hidden="true" />}
      </label>
      {error && <small id="context-error" className="context-error" role="alert">{error}</small>}
    </div>
  );
}
