import type { Metadata } from "next";
import { AuthenticatedShell } from "@/app/components/authenticated-shell";
import { requireClient } from "@/lib/auth/guards";
import { getChecklistDashboardData } from "@/lib/data/checklist-dashboard";
import { ChecklistDashboard } from "./checklist-dashboard";

export const metadata: Metadata = { title: "Dashboard de checklists | Portal Univelt" };

export default async function ChecklistDashboardPage() {
  const session = await requireClient();
  const data = await getChecklistDashboardData(session);
  return <AuthenticatedShell variant="client"><ChecklistDashboard data={data} /></AuthenticatedShell>;
}
