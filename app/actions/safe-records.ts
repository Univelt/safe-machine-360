"use server";

import * as records from "./records";
import * as imports from "./machine-import";
import { runSafeAction } from "@/lib/action-errors";
export type { MachineImportPreviewResult } from "./machine-import";

export async function checkMachineCodeAction(data: Parameters<typeof records.checkMachineCodeAction>[0]) { return runSafeAction("machine.code.check", () => records.checkMachineCodeAction(data)); }

export async function createCompanyAction(data: FormData) { return runSafeAction("company.create", () => records.createCompanyAction(data)); }
export async function createUserAction(data: FormData) { return runSafeAction("user.create", () => records.createUserAction(data)); }
export async function createMachineAction(data: FormData) { return runSafeAction("machine.create", () => records.createMachineAction(data)); }
export async function updateMachineAction(data: FormData) { return runSafeAction("machine.update", () => records.updateMachineAction(data)); }
export async function deleteMachineAction(data: FormData) { return runSafeAction("machine.delete", () => records.deleteMachineAction(data)); }
export async function uploadMachinePhotoAction(data: FormData) { return runSafeAction("machine.photo.upload", () => records.uploadMachinePhotoAction(data)); }
export async function deleteMachinePhotoAction(data: FormData) { return runSafeAction("machine.photo.delete", () => records.deleteMachinePhotoAction(data)); }
export async function updateMachinePhotoAction(data: FormData) { return runSafeAction("machine.photo.update", () => records.updateMachinePhotoAction(data)); }
export async function createDocumentAction(data: FormData) { return runSafeAction("document.create", () => records.createDocumentAction(data)); }
export async function createActivityAction(data: FormData) { return runSafeAction("activity.create", () => records.createActivityAction(data)); }
export async function updateActivityProgressAction(data: FormData) { return runSafeAction("activity.progress", () => records.updateActivityProgressAction(data)); }
export async function uploadActivityEvidenceAction(data: FormData) { return runSafeAction("activity.evidence.upload", () => records.uploadActivityEvidenceAction(data)); }
export async function deleteActivityEvidenceAction(data: FormData) { return runSafeAction("activity.evidence.delete", () => records.deleteActivityEvidenceAction(data)); }
export async function createRiskAssessmentAction(data: FormData) { return runSafeAction("risk.create", () => records.createRiskAssessmentAction(data)); }
export async function createChecklistTemplateAction(data: FormData) { return runSafeAction("checklist.template.create", () => records.createChecklistTemplateAction(data)); }
export async function addChecklistItemAction(data: FormData) { return runSafeAction("checklist.item.create", () => records.addChecklistItemAction(data)); }
export async function createChecklistAction(data: FormData) { return runSafeAction("checklist.create", () => records.createChecklistAction(data)); }
export async function createActionPlanAction(data: FormData) { return runSafeAction("action-plan.create", () => records.createActionPlanAction(data)); }
export async function previewMachineImportAction(data: FormData) { return runSafeAction("machine.import.preview", () => imports.previewMachineImportAction(data)); }
export async function confirmMachineImportAction(data: FormData) { return runSafeAction("machine.import.confirm", () => imports.confirmMachineImportAction(data)); }
