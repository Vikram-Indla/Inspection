"use server";
// M8 / PLN-CON-018 — Discard draft: an own, never-published draft plan
// (single / bulk / validated) is retired by stamping visit_plans.archived_at.
// This is semantically NOT the cancellation of a published visit — the UI
// copy keeps "Discard draft" and "Cancel visit" strictly separate.
//
// R01/R08 — the atomic archive RPC preserves every linked child's Draft
// identity and writes additive archive provenance, audit and durable outbox
// intent in the same transaction. No child is relabelled Cancelled.
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import {
  classifyPlanningClosureError,
  parsePlanningArchiveReceipt,
  type PlanningArchiveReceipt,
  type PlanningClosureError,
} from "@/lib/planning/closure-receipts";

export type DiscardResult = {
  error?: string;
  errorCode?: PlanningClosureError;
  ok?: string;
  receipt?: PlanningArchiveReceipt;
};

export async function discardDraftPlan(_: DiscardResult, fd: FormData): Promise<DiscardResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const planId = String(fd.get("plan_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(planId)) return { error: "Missing plan id (PLN-CON-018)" };
  const { data: plan, error: readErr } = await sb.from("visit_plans")
    .select("id, created_by, status, archived_at, plan_reference, draft_version")
    .eq("id", planId).maybeSingle();
  if (readErr) {
    console.error("[M8 discardDraftPlan] plan read failed:", readErr.message);
    return { error: "Planning data is temporarily unavailable (ERR-OPS-001) — nothing was changed." };
  }
  // Own drafts only — the same ownership boundary resume already enforces.
  if (!plan || plan.created_by !== user.id || plan.archived_at)
    return { error: "Draft not found, already discarded, or owned by someone else (PLN-CON-018)" };
  if (!["draft", "validated"].includes(plan.status))
    return { error: "Only a never-published draft can be discarded — a published plan is cancelled per visit instead (PLN-CON-018)" };
  const correlationId = crypto.randomUUID();
  const note = String(fd.get("note") ?? "").trim() || null;
  const { data, error } = await sb.rpc("archive_planning_draft_atomic", {
    p_plan_id: planId,
    p_expected_plan_version: plan.draft_version,
    p_note: note,
    p_idempotency_key: `archive:${planId}:${plan.draft_version}`,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[R01 archive_planning_draft_atomic] failed:", error.message, error.code);
    const errorCode = classifyPlanningClosureError(error);
    return { error: "Draft archival was not committed. Refresh the draft and try again.", errorCode };
  }
  const receipt = parsePlanningArchiveReceipt(data);
  if (!receipt || receipt.planId !== planId || receipt.correlationId !== correlationId) {
    console.error("[R01 archive_planning_draft_atomic] invalid receipt");
    return { error: "The archive result could not be reconciled. Refresh before retrying.", errorCode: "receipt_invalid" };
  }
  revalidatePath("/planning"); revalidatePath("/planning/bulk/review"); revalidatePath("/visits");
  return {
    ok: `Draft ${plan.plan_reference ?? ""} archived — Draft identity preserved; ${receipt.outboxIntentIds.length} outbox intent(s) queued, not delivered. (PLN-R01 · PLN-R08 · PLN-R10)`.trim(),
    receipt,
  };
}
