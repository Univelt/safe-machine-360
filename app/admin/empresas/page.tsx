import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { CompaniesAdminContent } from "./companies-admin-content";
import { listCompanies } from "@/lib/data/machines";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Empresas | Administração" };

export default async function CompaniesAdminPage() {
  await requireAdmin();
  const companies = await listCompanies();
  return <AuthenticatedShell variant="admin"><CompaniesAdminContent companies={companies} /></AuthenticatedShell>;
}
