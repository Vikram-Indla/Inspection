"use server";
// TASK-EXECUTION-MODULE-001 · Phase 3B — Pre-Execution field actions.
// Thin wrappers over lib/execution/readiness.ts with the shared supabaseServer
// client. The readiness RPCs (20260721120000) are the authoritative write path
// — they re-verify the caller (assigned inspector + execution.prepare) and
// every business rule on each call; these actions only transport the result.
// Errors arrive as neutral codes (stable tokens are mapped inside the lib);
// the panel renders plain copy per code and never sees provider text.
import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase-server";
import {
  confirmVisitReady,
  reopenVisitPreparation,
  saveVisitPreparation,
  type PreparationFormConfig,
} from "@/lib/execution";

export type PreparationActionResult = {
  ok?: boolean;
  error?: string; // neutral code (READINESS_* / NEUTRAL_WRITE_ERROR) — never provider text
  snapshot?: { preparation_version: number; checksum: string };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function savePreparation(input: {
  visitId: string;
  executionDate: string | null;
  confirmedMode: "physical" | "virtual" | null;
  packageVersionId: string | null;
  formConfig: PreparationFormConfig;
}): Promise<PreparationActionResult> {
  if (!UUID.test(input.visitId)) return { error: "READINESS_VISIT_STATE" };
  if (input.executionDate != null && !DATE.test(input.executionDate)) return { error: "READINESS_DATE_OUTSIDE_WINDOW" };
  if (input.confirmedMode != null && !["physical", "virtual"].includes(input.confirmedMode)) return { error: "READINESS_MODE_INELIGIBLE" };
  if (input.packageVersionId != null && !UUID.test(input.packageVersionId)) return { error: "READINESS_PACKAGE_INELIGIBLE" };
  const sb = await supabaseServer();
  const r = await saveVisitPreparation(sb, {
    visitId: input.visitId,
    executionDate: input.executionDate,
    confirmedMode: input.confirmedMode,
    packageVersionId: input.packageVersionId,
    formConfig: input.formConfig ?? {},
  });
  if (r.error) return { error: r.error };
  revalidatePath(`/field/${input.visitId}`);
  return { ok: true };
}

export async function confirmReady(visitId: string): Promise<PreparationActionResult> {
  if (!UUID.test(visitId)) return { error: "READINESS_VISIT_STATE" };
  const sb = await supabaseServer();
  const r = await confirmVisitReady(sb, visitId);
  if (r.error) return { error: r.error };
  revalidatePath(`/field/${visitId}`);
  return {
    ok: true,
    snapshot: r.snapshot
      ? { preparation_version: r.snapshot.preparation_version, checksum: r.snapshot.checksum }
      : undefined,
  };
}

export async function reopenPreparation(visitId: string): Promise<PreparationActionResult> {
  if (!UUID.test(visitId)) return { error: "READINESS_VISIT_STATE" };
  const sb = await supabaseServer();
  const r = await reopenVisitPreparation(sb, visitId);
  if (r.error) return { error: r.error };
  revalidatePath(`/field/${visitId}`);
  return { ok: true };
}
