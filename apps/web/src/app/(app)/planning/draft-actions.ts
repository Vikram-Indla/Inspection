"use server";
// M8 / PLN-CON-018 — Discard draft: an own, never-published draft plan
// (single / bulk / validated) is retired by stamping visit_plans.archived_at.
// This is semantically NOT the cancellation of a published visit — the UI
// copy keeps "Discard draft" and "Cancel visit" strictly separate.
//
// Child visits: a draft plan produced by duplicateVisit carries one linked
// DRAFT visit. Canonical §15 allows cancellation for Draft, so each draft
// child is cancelled (never touched otherwise) and receives the
// 'discard_draft' lifecycle event naming the plan; the archived plan row
// plus the append-only audit trigger remain the plan-level record. Draft
// child rows cannot be hard-deleted — visits RLS grants no delete.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type DiscardResult = {
  error?: string;
  ok?: string;
  receipt?: {
    commandId: string;
    correlationId: string;
    childCount: number;
    idempotent: boolean;
  };
};

export async function discardDraftPlan(_: DiscardResult, fd: FormData): Promise<DiscardResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) return { error: "Planning data is temporarily unavailable (ERR-OPS-001) — nothing was changed." };
  if (!user) return { error: "Session expired — sign in again." };
  const planId = String(fd.get("plan_id") ?? "").trim();
  const expectedVersion = Number(fd.get("expected_version"));
  const idempotencyKey = String(fd.get("idempotency_key") ?? "").trim();
  const correlationId = String(fd.get("correlation_id") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(planId) || !Number.isInteger(expectedVersion) || expectedVersion < 1
      || !idempotencyKey || !uuid.test(correlationId)) {
    return { error: "The draft archive request is incomplete (PLANNING-ARCHIVE-REQUEST). Nothing was changed." };
  }
  const { data, error } = await sb.rpc("archive_planning_draft_atomic", {
    p_plan_id: planId,
    p_expected_plan_version: expectedVersion,
    p_note: null,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[PLN-S08 discardDraftPlan] governed archive failed:", error.code, error.message);
    if (error.code === "42501") return { error: "You do not have permission or scope to archive this draft. Nothing was changed." };
    if (error.code === "23514") return { error: "This draft changed, was already archived, or is no longer eligible. Refresh before trying again." };
    if (error.code === "23505") return { error: "This retry does not match the original archive request. Nothing was changed." };
    return { error: "Planning data is temporarily unavailable (ERR-OPS-001) — nothing was changed." };
  }
  const receipt = data as {
    command_id?: string; correlation_id?: string; child_count?: number; idempotent?: boolean;
    planning_status_preserved?: boolean;
  } | null;
  if (!receipt?.command_id || !receipt.correlation_id || receipt.planning_status_preserved !== true) {
    console.error("[PLN-S08 discardDraftPlan] incomplete archive receipt");
    return { error: "The archive result could not be verified. Refresh before retrying." };
  }
  revalidatePath("/planning"); revalidatePath("/planning/bulk/review"); revalidatePath("/visits");
  return {
    ok: "Draft archived — its Planning status and provenance were preserved. This cannot be restored.",
    receipt: {
      commandId: receipt.command_id,
      correlationId: receipt.correlation_id,
      childCount: receipt.child_count ?? 0,
      idempotent: receipt.idempotent === true,
    },
  };
}
