"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { validateWorkflowPayload, type WfPayload } from "@/lib/workflow/validate";

export type WfResult = { error?: string; ok?: boolean };

// SCR-ADM-050/051 · ENG-03 — workflow semantics live in config_versions
// (engine='workflow'). Governed change: propose draft → distinct approver
// publishes (RBAC-002 maker-checker, DB constraint). Never engine_settings.

// Propose a new draft version cloning the base version's state machine.
export async function proposeWorkflowDraft(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const base_id = String(formData.get("base_version_id") ?? "");
  const version_label = String(formData.get("version_label") ?? "").trim();
  if (!base_id || !version_label) return { error: "Version label is required." };

  const { data: base, error: baseError } = await sb.from("config_versions")
    .select("engine, object_id, payload").eq("id", base_id).eq("engine", "workflow").single();
  if (baseError) { logProviderError("admin workflow base read", baseError); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!base) return { error: "Base workflow version not found." };

  const { error } = await sb.from("config_versions").insert({
    engine: "workflow", object_id: base.object_id, version_label,
    status: "draft", payload: base.payload, created_by: user.id,
  });
  if (error) { logProviderError("admin workflow draft", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/workflows");
  return { ok: true };
}

// Draft payloads are editable; published versions are immutable config.
export async function saveWorkflowDraft(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");
  let payload: { object?: unknown; states?: unknown; transitions?: unknown };
  try { payload = JSON.parse(String(formData.get("payload") ?? "")); }
  catch { return { error: "Payload was not valid JSON." } }
  if (!payload || typeof payload.object !== "string" || !Array.isArray(payload.states) || !Array.isArray(payload.transitions)) {
    return { error: "Payload must define object, states[] and transitions[] (state machine shape)." };
  }

  // GAP-08 optimistic concurrency: when the editor submits the row_version it
  // loaded, compare-and-set so a stale overwrite is rejected instead of
  // silently clobbering a concurrent edit.
  const rawRowVersion = String(formData.get("row_version") ?? "").trim();
  let q = sb.from("config_versions")
    .update({ payload }, { count: "exact" })
    .eq("id", version_id).eq("engine", "workflow").eq("status", "draft");
  const expectedRowVersion = rawRowVersion ? Number(rawRowVersion) : null;
  if (expectedRowVersion !== null && Number.isFinite(expectedRowVersion)) {
    q = q.eq("row_version", expectedRowVersion);
  }

  const { error, count } = await q;
  if (error) { logProviderError("admin workflow save", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) {
    // Disambiguate stale-conflict from immutability using the current row state.
    const { data: cur } = await sb.from("config_versions")
      .select("status, row_version").eq("id", version_id).eq("engine", "workflow").maybeSingle();
    if (cur && cur.status !== "draft") {
      return { error: "Only draft versions are editable — published workflow config is immutable." };
    }
    if (expectedRowVersion !== null && cur && cur.row_version !== expectedRowVersion) {
      return { error: "This draft changed since you loaded it — reload to see the latest, then re-apply your edit." };
    }
    return { error: "Only draft versions are editable — published workflow config is immutable." };
  }
  revalidatePath("/admin/workflows");
  return { ok: true };
}

// RBAC-002 maker-checker — the maker_checker DB constraint rejects
// self-approval (approved_by must differ from created_by).
export async function approvePublishWorkflow(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");

  // GAP-01 publish gate — deterministic graph validation (VAL-01..06) must pass
  // before a version can go live. Blocks unreachable/orphan/invalid-terminal,
  // ambiguous transitions, unauthorized transitions and non-idempotent side
  // effects. Read the draft payload we are about to publish.
  const { data: draft, error: draftErr } = await sb.from("config_versions")
    .select("payload").eq("id", version_id).eq("engine", "workflow").eq("status", "draft").maybeSingle();
  if (draftErr) { logProviderError("admin workflow publish read", draftErr); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!draft) return { error: "No draft to publish — RLS requires a workflow-scope admin role." };

  const validation = validateWorkflowPayload(draft.payload as WfPayload);
  if (!validation.ok) {
    const failing = validation.checks.filter((c) => !c.ok).map((c) => `${c.id} ${c.why}`).join(" ");
    return { error: `Validation failed — resolve before publishing. ${failing}` };
  }

  // Optional scheduled activation (MVP2-REQ-0042): a future scheduled_from is a
  // scheduled (not-yet-active) version and is never approximated by effective_from=now().
  const rawSchedule = String(formData.get("scheduled_from") ?? "").trim();
  const scheduled_from = rawSchedule ? new Date(rawSchedule).toISOString() : null;

  const { error, count } = await sb.from("config_versions").update({
    approved_by: user.id, status: "published",
    effective_from: new Date().toISOString(),
    scheduled_from,
  }, { count: "exact" }).eq("id", version_id).eq("engine", "workflow").eq("status", "draft");
  if (error) { logProviderError("admin workflow publish", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "No draft to publish — RLS requires a workflow-scope admin role." };
  revalidatePath("/admin/workflows");
  return { ok: true };
}

// MVP2-REQ-0026 governed Retire — a published version moves to 'retired' with a
// mandatory reason. Distinct maker/checker is enforced by the DB constraint on
// the row; the retirer must not be the version's creator (checked here) and a
// live successor must exist so retiring never leaves the object without a
// published workflow. Never a silent 'deactivated' approximation.
export async function retireWorkflowVersion(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");
  const reason = String(formData.get("retire_reason") ?? "").trim();
  if (!reason) return { error: "A governed reason is required to retire a workflow version." };

  const { data: target, error: tErr } = await sb.from("config_versions")
    .select("object_id, created_by, status").eq("id", version_id).eq("engine", "workflow").maybeSingle();
  if (tErr) { logProviderError("admin workflow retire read", tErr); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!target || target.status !== "published") return { error: "Only a published version can be retired." };
  if (target.created_by === user.id) return { error: "Maker-checker — the version's author cannot retire it." };

  const { count: successors } = await sb.from("config_versions")
    .select("id", { count: "exact", head: true })
    .eq("engine", "workflow").eq("object_id", target.object_id).eq("status", "published").neq("id", version_id);
  if (!successors) return { error: "Cannot retire the only published version — publish a successor first." };

  const { error, count } = await sb.from("config_versions").update({
    status: "retired", retire_reason: reason, approved_by: user.id,
  }, { count: "exact" }).eq("id", version_id).eq("engine", "workflow").eq("status", "published");
  if (error) { logProviderError("admin workflow retire", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Retire blocked — RLS requires a workflow-scope admin role." };
  revalidatePath("/admin/workflows");
  return { ok: true };
}

// MVP2-REQ-0026 Rolled Back — clone a last-good version to a new draft that
// records its rollback target (rollback_of). The clone follows the normal
// validated publish path; no new primitive and no in-place mutation of history.
export async function rollbackWorkflowToVersion(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };

  const good_id = String(formData.get("last_good_version_id") ?? "");
  const version_label = String(formData.get("version_label") ?? "").trim();
  if (!good_id || !version_label) return { error: "Rollback target and a new version label are required." };

  const { data: good, error: gErr } = await sb.from("config_versions")
    .select("object_id, payload").eq("id", good_id).eq("engine", "workflow").maybeSingle();
  if (gErr) { logProviderError("admin workflow rollback read", gErr); return { error: NEUTRAL_LOAD_ERROR }; }
  if (!good) return { error: "Rollback target version not found." };

  const { error } = await sb.from("config_versions").insert({
    engine: "workflow", object_id: good.object_id, version_label,
    status: "draft", payload: good.payload, created_by: user.id, rollback_of: good_id,
  });
  if (error) { logProviderError("admin workflow rollback", error); return { error: NEUTRAL_WRITE_ERROR }; }
  revalidatePath("/admin/workflows");
  return { ok: true };
}
