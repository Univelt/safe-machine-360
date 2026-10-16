import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { DocumentsContent } from "./documents-content";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { listDocuments } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Documentos | Área do cliente", description: "Documentos e validades da empresa vinculada." };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ deleted?: string; cleanupReference?: string }> }) {
  const session = await requireClient();
  const documents = await listDocuments(session);
  const query = await searchParams;
  const cleanupReference = /^MS360-[a-f0-9-]{36}$/.test(query.cleanupReference ?? "") ? query.cleanupReference : undefined;
  return <AuthenticatedShell variant="client"><DocumentsContent documents={documents} companyName={session.companyName ?? "Empresa"} canCreate={canMutateOperations(session)} deletion={query.deleted === "1" ? { cleanupReference } : undefined} /></AuthenticatedShell>;
}
