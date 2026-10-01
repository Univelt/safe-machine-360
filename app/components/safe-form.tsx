"use client";

import { createContext, useContext, useRef, useState, useTransition, type ComponentProps } from "react";
import { unstable_rethrow } from "next/navigation";
import { describeError, isActionFailure, type FormActionResult, type FriendlyError } from "@/lib/friendly-errors";
import { ErrorNotice } from "./error-notice";

type Props = Omit<ComponentProps<"form">, "action"> & { action: (data: FormData) => FormActionResult | Promise<FormActionResult> };
const PendingContext = createContext({ pending: false });
export function useSafeFormStatus() { return useContext(PendingContext); }

export function SafeForm({ action, onSubmit, children, className, ...props }: Props) {
  const [error, setError] = useState<FriendlyError | null>(null);
  const [pending, startTransition] = useTransition();
  const sending = useRef(false);

  function submit(event: Parameters<NonNullable<Props["onSubmit"]>>[0]) {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement ? new FormData(form, submitter) : new FormData(form);
    sending.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(data);
        if (isActionFailure(result)) setError(result.error);
        else form.reset();
      } catch (cause) {
        unstable_rethrow(cause);
        setError(describeError(cause));
      } finally { sending.current = false; }
    });
  }

  return (
    <PendingContext value={{ pending }}><form {...props} className={`safe-form ${className ?? ""}`} onSubmit={submit} aria-busy={pending}>
      {error && <ErrorNotice error={error} />}
      {children}
      {pending && <p className="safe-form-progress" role="status">Enviando… Aguarde a confirmação.</p>}
    </form></PendingContext>
  );
}
