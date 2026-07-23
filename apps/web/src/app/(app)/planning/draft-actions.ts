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
import { recordLifecycleEvent } from "@/lib/planning/lifecycle";

export type DiscardResult = { error?: string; ok?: string };

export async function discardDraftPlan(_: DiscardResult, fd: FormData): Promise<DiscardResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const planId = String(fd.get("plan_id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(planId)) return { error: "Missing plan id (PLN-CON-018)" };
  const { data: plan, error: readErr } = await sb.from("visit_plans")
    .select("id, created_by, status, archived_at, plan_reference")
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
  const { data: children, error: chErr } = await sb.from("visits")
    .select("id, planning_status, window_start, window_end").eq("visit_plan_id", planId);
  if (chErr) {
    console.error("[M8 discardDraftPlan] child read failed:", chErr.message);
    return { error: "Planning data is temporarily unavailable (ERR-OPS-001) — nothing was changed." };
  }
  // Fail closed: a published child means the plan is not a pure draft.
  if ((children ?? []).some(v => v.planning_status !== "draft"))
    return { error: "This plan already has published visits — discard is blocked; manage the visits individually (PLN-CON-018)" };
  const now = new Date().toISOString();
  const { data: updated, error: upErr } = await sb.from("visit_plans")
    .update({ archived_at: now })
    .eq("id", planId).eq("created_by", user.id).in("status", ["draft", "validated"]).is("archived_at", null)
    .select("id");
  if (upErr) {
    console.error("[M8 discardDraftPlan] archive failed:", upErr.message);
    return { error: "Planning data is temporarily unavailable (ERR-OPS-001) — nothing was changed." };
  }
  if (!updated?.length) return { error: "No row updated — the draft changed concurrently or RLS denied the update (PLN-CON-018)" };
  // Cancel each draft child (canonical §15: Draft cancellation is allowed) and
  // record the discard provenance on it. Best-effort per child: the plan is
  // already archived, so a gap is logged and surfaced, never rolled back.
  let eventGap = false;
  for (const child of children ?? []) {
    const { data: asg } = await sb.from("assignments").select("inspector_id").eq("visit_id", child.id).maybeSingle();
    const { error: cErr } = await sb.from("visits")
      .update({ planning_status: "cancelled" })
      .eq("id", child.id).eq("planning_status", "draft");
    if (cErr) { console.error("[M8 discardDraftPlan] draft child cancel failed:", cErr.message); eventGap = true; continue; }
    const evErr = await recordLifecycleEvent(sb, {
      visitId: child.id, eventType: "discard_draft", actor: user.id,
      comments: `Draft plan ${plan.plan_reference ?? plan.id.slice(0, 8)} discarded`,
      previous: { planning_status: "draft", inspector_id: asg?.inspector_id ?? null, window_start: child.window_start, window_end: child.window_end, plan_id: planId },
    });
    if (evErr) eventGap = true;
  }
  revalidatePath("/planning"); revalidatePath("/planning/bulk/review"); revalidatePath("/visits");
  if (eventGap) return { error: "Draft discarded, but recording it on the linked draft visit failed — the gap is logged (PLN-CON-018)" };
  return { ok: `Draft ${plan.plan_reference ?? ""} discarded — archived, never published; this is not the cancellation of a published visit (PLN-CON-018)`.trim() };
}
