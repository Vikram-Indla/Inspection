"use server";
import { revalidatePath } from "next/cache";
import { fill, getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { isRiskModelTransitionAllowed, validateRiskModelPayload, type RiskModelPayload, type RiskModelStatus } from "@/lib/risk/model";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type RiskResult = { error?: string; ok?: boolean };

const MODES = ["off", "on"] as const;
const enabled = () => resolveFeatureFlag(process.env.FEATURE_RISK_WORKBENCH, MODES, "off") === "on";

async function messages() {
  return getMessages(await getLocale()).adminRiskModels.actions;
}

export async function createRiskDraft(_: RiskResult, formData: FormData): Promise<RiskResult> {
  const m = await messages();
  if (!enabled()) return { error: m.flagOff };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: m.sessionExpired };
  const version_label = String(formData.get("version_label") ?? "").trim();
  if (!version_label) return { error: m.versionLabelRequired };
  let payload: RiskModelPayload;
  try { payload = JSON.parse(String(formData.get("payload") ?? "")); }
  catch { return { error: m.payloadInvalid }; }
  const v = validateRiskModelPayload(payload);
  if (!v.ok) return { error: v.why };
  const { error } = await sb.from("risk_models").insert({
    model_key: "risk", version_label, status: "draft", payload, created_by: user.id,
  });
  if (error) { logProviderError("risk draft create", error); return { error: m.writeError }; }
  revalidatePath("/admin/risk/models");
  return { ok: true };
}

export async function transitionRiskModel(_: RiskResult, formData: FormData): Promise<RiskResult> {
  const m = await messages();
  if (!enabled()) return { error: m.flagOff };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: m.sessionExpired };
  const id = String(formData.get("model_id") ?? "");
  const to = String(formData.get("to_status") ?? "").trim() as RiskModelStatus;
  const from = String(formData.get("from_status") ?? "").trim() as RiskModelStatus;
  const expected = Number(formData.get("row_version") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!isRiskModelTransitionAllowed(from, to)) return { error: fill(m.illegalTransition, { from, to }) };
  const { error } = await sb.rpc("risk_model_transition", {
    p_model_id: id, p_to_status: to, p_expected_row_version: Number.isFinite(expected) ? expected : 0, p_reason: reason,
  });
  if (error) { logProviderError("risk model transition", error); return { error: fill(m.transitionRejected, { message: error.message }) }; }
  revalidatePath("/admin/risk/models");
  return { ok: true };
}
