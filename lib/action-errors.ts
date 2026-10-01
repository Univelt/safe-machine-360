import { randomUUID } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { describeError, type ActionFailure } from "./friendly-errors";

export function reportServerError(error: unknown, operation: string) {
  unstable_rethrow(error);
  const description = describeError(error);
  const reference = `MS360-${randomUUID()}`;
  // Do not log submitted forms, files or credentials. Detailed exceptions stay on the server.
  console.error("[MS360_ERROR]", { reference, operation, code: description.code }, error);
  return { ...description, reference };
}

export async function runSafeAction<T>(operation: string, action: () => Promise<T>): Promise<T | ActionFailure> {
  try {
    return await action();
  } catch (error) {
    return { ok: false, error: reportServerError(error, operation) };
  }
}

export function apiErrorResponse(error: unknown, operation: string) {
  const description = reportServerError(error, operation);
  const status = description.code === "ACESSO_RESTRITO" ? 403 : description.code === "REGISTRO_NAO_ENCONTRADO" ? 404 : description.code === "DADOS_INVALIDOS" ? 400 : description.code.includes("DUPLICAD") || description.code === "REGISTRO_VINCULADO" ? 409 : description.code === "SERVICO_INDISPONIVEL" ? 503 : 500;
  return Response.json({ error: `${description.message} ${description.nextStep}`, errorCode: description.code, reference: description.reference }, { status });
}

export async function runSafeRoute(operation: string, action: () => Promise<Response>): Promise<Response> {
  try { return await action(); }
  catch (error) { return apiErrorResponse(error, operation); }
}
