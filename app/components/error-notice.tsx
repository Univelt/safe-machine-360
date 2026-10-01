"use client";

import { useState } from "react";
import { AlertTriangle, Copy } from "lucide-react";
import type { FriendlyError } from "@/lib/friendly-errors";

export function ErrorNotice({ error }: { error: FriendlyError }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="friendly-error-notice" role="alert" aria-live="polite">
      <AlertTriangle size={21} aria-hidden="true" />
      <div>
        <strong>{error.title}</strong>
        <p>{error.message}</p>
        <p className="friendly-error-next-step">{error.nextStep}</p>
        <div className="friendly-error-reference">
          <small>Código: {error.code}{error.reference && <> · Referência: {error.reference}</>}</small>
          <button type="button" className="text-button" onClick={async () => {
            try { await navigator.clipboard.writeText(`${error.code}${error.reference ? ` · ${error.reference}` : ""}`); setCopied(true); }
            catch { setCopied(false); }
          }}><Copy size={14} aria-hidden="true" />{copied ? "Referência copiada" : "Copiar referência"}</button>
        </div>
      </div>
    </section>
  );
}
