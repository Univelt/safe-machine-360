import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { DocumentDetails } from "./document-details";
import { requireClient } from "@/lib/auth/guards";
import { getDocument } from "@/lib/data/catalog";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const session = await requireClient();
  const document = await getDocument(session, (await params).id);
  return { title: document ? `${document.name} | Portal Univelt` : "Documento não encontrado" };
}

export default async function DocumentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const document = await getDocument(session, (await params).id);
  if (!document) notFound();
  return <AuthenticatedShell variant="client"><DocumentDetails document={document} companyName={session.companyName ?? "Empresa"} /></AuthenticatedShell>;
}
