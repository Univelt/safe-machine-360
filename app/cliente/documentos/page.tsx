import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { DocumentsContent } from "./documents-content";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { listDocuments } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Documentos | Área do cliente", description: "Documentos e validades da empresa vinculada." };

export default async function DocumentsPage() {
  const session = await requireClient();
  const documents = await listDocuments(session);
  return <AuthenticatedShell variant="client"><DocumentsContent documents={documents} companyName={session.companyName ?? "Empresa"} canCreate={canMutateOperations(session)} /></AuthenticatedShell>;
}
