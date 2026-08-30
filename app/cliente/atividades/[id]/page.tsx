import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthenticatedShell } from "../../../components/authenticated-shell";
import { ActivityDetails } from "./activity-details";
import { requireClient } from "@/lib/auth/guards";
import { canMutateOperations } from "@/lib/auth/session";
import { getActivity } from "@/lib/data/catalog";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const session = await requireClient();
  const activity = await getActivity(session, (await params).id);
  return { title: activity ? `${activity.title} | Portal Univelt` : "Atividade não encontrada" };
}

export default async function ActivityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireClient();
  const activity = await getActivity(session, (await params).id);
  if (!activity) notFound();
  return <AuthenticatedShell variant="client"><ActivityDetails activity={activity} companyName={session.companyName ?? "Empresa"} canMutate={canMutateOperations(session)} /></AuthenticatedShell>;
}
