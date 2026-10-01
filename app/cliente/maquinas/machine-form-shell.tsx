"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { checkMachineCodeAction } from "@/app/actions/records";

const duplicateCodeMessage = "Este código já está cadastrado em outra máquina desta empresa. Informe um código exclusivo para continuar.";

export function MachineFormShell({
  action,
  children,
  machineId,
  initialCode,
  initialError,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  machineId?: string;
  initialCode?: string;
  initialError?: string;
  submitLabel: string;
}) {
  const validatedSignature = useRef<string | null>(null);
  const checking = useRef(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function validateCodeBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const code = String(data.get("code") ?? "").trim();
    const companyId = String(data.get("companyId") ?? "").trim();
    const signature = `${machineId ?? "new"}:${companyId}:${code}`;

    if (validatedSignature.current === signature) {
      validatedSignature.current = null;
      return;
    }
    if (machineId && code === initialCode) return;

    event.preventDefault();
    if (checking.current) return;
    checking.current = true;
    setIsChecking(true);

    const codeField = form.elements.namedItem("code");
    if (codeField instanceof HTMLInputElement) codeField.setCustomValidity("");

    try {
      const result = await checkMachineCodeAction({ machineId, companyId, code });
      if (!result.available) {
        const message = result.message ?? duplicateCodeMessage;
        setError(message);
        if (codeField instanceof HTMLInputElement) {
          codeField.setAttribute("aria-invalid", "true");
          codeField.closest("label")?.classList.add("field-invalid");
          codeField.focus();
        }
        return;
      }

      setError("");
      if (codeField instanceof HTMLInputElement) {
        codeField.setAttribute("aria-invalid", "false");
        codeField.closest("label")?.classList.remove("field-invalid");
      }
      validatedSignature.current = signature;
      form.requestSubmit();
    } catch {
      setError("Não foi possível validar o código agora. Seus dados foram mantidos; tente salvar novamente.");
    } finally {
      checking.current = false;
      setIsChecking(false);
    }
  }

  function clearCodeError(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "code") return;
    target.setCustomValidity("");
    target.setAttribute("aria-invalid", "false");
    target.closest("label")?.classList.remove("field-invalid");
    validatedSignature.current = null;
    setError("");
  }

  return (
    <form className="panel record-form" action={action} onSubmit={validateCodeBeforeSubmit} onChange={clearCodeError}>
      {error && <p className="full machine-code-error" role="alert">{error}</p>}
      {children}
      <div className="form-actions">
        <button className="button primary" type="submit" disabled={isChecking}>
          {isChecking ? "Verificando código…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
