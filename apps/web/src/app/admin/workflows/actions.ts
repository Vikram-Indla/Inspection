"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type WfResult = { error?: string; ok?: boolean };

// SCR-ADM-050/051 · ENG-03 — workflow semantics live in config_versions
// (engine='workflow'). Governed change: propose draft → distinct approver
// publishes (RBAC-002 maker-checker, DB constraint). Never engine_settings.

// Propose a new draft version cloning the base version's state machine.
export async function proposeWorkflowDraft(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
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
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");
  let payload: { object?: unknown; states?: unknown; transitions?: unknown };
  try { payload = JSON.parse(String(formData.get("payload") ?? "")); }
  catch { return { error: "Payload was not valid JSON." } }
  if (!payload || typeof payload.object !== "string" || !Array.isArray(payload.states) || !Array.isArray(payload.transitions)) {
    return { error: "Payload must define object, states[] and transitions[] (ENG-03 state machine shape)." };
  }

  const { error, count } = await sb.from("config_versions")
    .update({ payload }, { count: "exact" })
    .eq("id", version_id).eq("engine", "workflow").eq("status", "draft");
  if (error) { logProviderError("admin workflow save", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Only draft versions are editable — published workflow config is immutable." };
  revalidatePath("/admin/workflows");
  return { ok: true };
}

// RBAC-002 maker-checker — the maker_checker DB constraint rejects
// self-approval (approved_by must differ from created_by).
export async function approvePublishWorkflow(_: WfResult, formData: FormData): Promise<WfResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Session expired — sign in again." };

  const version_id = String(formData.get("version_id") ?? "");
  const { error, count } = await sb.from("config_versions").update({
    approved_by: user.id, status: "published", effective_from: new Date().toISOString(),
  }, { count: "exact" }).eq("id", version_id).eq("engine", "workflow").eq("status", "draft");
  if (error) { logProviderError("admin workflow publish", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "No draft to publish — RLS requires a workflow-scope admin role." };
  revalidatePath("/admin/workflows");
  return { ok: true };
}
