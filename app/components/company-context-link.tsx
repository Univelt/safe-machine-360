"use client";

import { ChevronRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompanyContextLink({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function openCompany() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (!response.ok) throw new Error("Falha ao selecionar empresa");
      router.push("/admin/maquinas");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível abrir a empresa.");
    } finally {
      setPending(false);
    }
  }

  return <div className="company-context-action">
    <button className="button secondary compact" type="button" onClick={openCompany} disabled={pending} aria-label={`Abrir empresa ${companyName}`}>{pending ? <LoaderCircle className="spin" size={15} /> : <>Abrir empresa <ChevronRight size={15} /></>}</button>
    {error && <small className="context-error" role="alert">{error}</small>}
  </div>;
}
