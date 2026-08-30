import type { Metadata } from "next";
import { AuthenticatedShell } from "../../components/authenticated-shell";
import { ActivitiesContent } from "./activities-content";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { listActivities } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Atividades | Área do cliente", description: "Plano de ação da empresa vinculada." };

export default async function ActivitiesPage() {
  const session = await requireClient();
  const activities = await listActivities(session);
  return <AuthenticatedShell variant="client"><ActivitiesContent activities={activities} companyName={session.companyName ?? "Empresa"} canCreate={canMutateOperations(session)} /></AuthenticatedShell>;
}
