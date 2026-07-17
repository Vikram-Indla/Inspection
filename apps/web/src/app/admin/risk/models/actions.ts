"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_LOAD_ERROR, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { validateRiskModelPayload, isRiskModelTransitionAllowed, type RiskModelStatus, type RiskModelPayload } from "@/lib/risk/model";

// TASK-MVP2-M2-04-RISK-TARGETING-001 · MVP2-REQ-0005..0012 · CD-032.
// Governed risk-model draft-layer actions. Flag-gated (risk_workbench_v2). No
// policy VALUES invented — the draft payload's weights/bands come from the user
// and are validated against the accepted structure before persistence.

export type RiskResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;
const enabled = () => resolveFeatureFlag(process.env.FEATURE_RISK_WORKBENCH, MODES, "off") === "on";

export async function createRiskDraft(_: RiskResult, formData: FormData): Promise<RiskResult> {
  if (!enabled()) return { error: "Risk workbench is feature-flagged off (FEATURE_RISK_WORKBENCH)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const version_label = String(formData.get("version_label") ?? "").trim();
  if (!version_label) return { error: "A version label is required." };
  let payload: RiskModelPayload;
  try { payload = JSON.parse(String(formData.get("payload") ?? "")); }
  catch { return { error: "Payload was not valid JSON." }; }
  const v = validateRiskModelPayload(payload);
  if (!v.ok) return { error: v.why };
  const { error } = await sb.from("risk_models").insert({
    model_key: "risk", version_label, status: "draft", payload, created_by: user.id,
  });
  if (error) { logProviderError("risk draft create", error); return { error: `${NEUTRAL_WRITE_ERROR} (risk_owner scope required).` }; }
  return { ok: true };
}

export async function transitionRiskModel(_: RiskResult, formData: FormData): Promise<RiskResult> {
  if (!enabled()) return { error: "Risk workbench is feature-flagged off (FEATURE_RISK_WORKBENCH)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("model_id") ?? "");
  const to = String(formData.get("to_status") ?? "").trim() as RiskModelStatus;
  const from = String(formData.get("from_status") ?? "").trim() as RiskModelStatus;
  const expected = Number(formData.get("row_version") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!isRiskModelTransitionAllowed(from, to)) return { error: `Illegal transition ${from} → ${to}.` };
  const { error } = await sb.rpc("risk_model_transition", {
    p_model_id: id, p_to_status: to, p_expected_row_version: Number.isFinite(expected) ? expected : 0, p_reason: reason,
  });
  if (error) { logProviderError("risk model transition", error); return { error: `Transition rejected: ${error.message}` }; }
  return { ok: true };
}
