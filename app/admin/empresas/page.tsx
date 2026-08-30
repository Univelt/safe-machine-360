import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { CompaniesAdminContent } from "./companies-admin-content";
import { listCompanies } from "@/lib/data/machines";

export const metadata: Metadata = { title: "Empresas | Administração" };

export default async function CompaniesAdminPage() {
  const companies = await listCompanies();
  return <AuthenticatedShell variant="admin"><CompaniesAdminContent companies={companies} /></AuthenticatedShell>;
}
