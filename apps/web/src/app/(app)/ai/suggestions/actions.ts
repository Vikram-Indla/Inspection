"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { canDispose, isDispositionAllowed, isSuggestionSurfaceAllowed, type AiDisposition } from "@/lib/ai/suggestions";
import { getGeminiProvider } from "@/lib/providers/ai-gemini";

// TASK-MVP2-M2-11-ASSISTIVE-AI-001 · MVP2-REQ-0056..0066,0217..0223 · CD-048.
// Governed AI-suggestion actions (ai_dockets_v1 default OFF). AI is advisory only:
// a human disposition is mandatory; legal source surfaces are refused; the provider
// adapter is fail-closed (no credentials → suggestions carry provider_status
// 'unavailable' and are never auto-actioned).
export type AiResult = { error?: string; ok?: boolean };
const MODES = ["off", "on"] as const;
const enabled = () => resolveFeatureFlag(process.env.FEATURE_AI_DOCKETS, MODES, "off") === "on";
const refs = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 20);

export async function proposeSuggestion(_: AiResult, formData: FormData): Promise<AiResult> {
  if (!enabled()) return { error: "AI dockets are feature-flagged off (FEATURE_AI_DOCKETS)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const surface = String(formData.get("surface") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const evidence_refs = refs(formData.get("evidence_refs"));
  const clause_refs = refs(formData.get("clause_refs"));
  if (!surface) return { error: "A surface is required." };
  if (!isSuggestionSurfaceAllowed(surface)) return { error: "AI must never generate legal source text on this surface." };
  if (!text) return { error: "Suggestion content is required." };
  if (!evidence_refs.length) return { error: "At least one evidence reference is required." };
  const { data, error } = await sb.from("ai_suggestions").insert({
    surface, suggestion: { text, evidence_refs, clause_refs, confidence: null, confidence_status: "not_supplied" }, disposition: "proposed", provider_status: "unavailable",
  }).select("id").maybeSingle();
  if (error) { logProviderError("ai propose", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (data?.id) await sb.from("ai_events").insert({ suggestion_id: data.id, event_type: "proposed", actor: user.id, payload: { surface } });
  return { ok: true };
}

// Generate an ADVISORY suggestion via the Gemini provider. Fail-closed: no key →
// provider unavailable, nothing created. Legal surfaces refused. The generated
// text lands as a 'proposed' suggestion requiring the SAME human disposition —
// AI never writes a decision.
export async function generateAiSuggestion(_: AiResult, formData: FormData): Promise<AiResult> {
  if (!enabled()) return { error: "AI dockets are feature-flagged off (FEATURE_AI_DOCKETS)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const surface = String(formData.get("surface") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();
  const evidence_refs = refs(formData.get("evidence_refs"));
  const clause_refs = refs(formData.get("clause_refs"));
  if (!surface) return { error: "A surface is required." };
  if (!isSuggestionSurfaceAllowed(surface)) return { error: "AI must never generate legal source text on this surface." };
  if (!evidence_refs.length) return { error: "At least one evidence reference is required before generation." };
  const provider = getGeminiProvider();
  if (!provider) return { error: "AI provider is unavailable (fail-closed — GEMINI_API_KEY not configured)." };
  const gen = await provider.generate(surface, context);
  if (!gen.ok || !gen.text) return { error: `AI provider did not return a usable suggestion (${gen.reason ?? "unknown"}).` };
  const { data, error } = await sb.from("ai_suggestions").insert({
    surface, suggestion: { text: gen.text, source: "gemini", evidence_refs, clause_refs, confidence: null, confidence_status: "provider_not_supplied" }, disposition: "proposed", provider_status: "configured",
  }).select("id").maybeSingle();
  if (error) { logProviderError("ai generate", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (data?.id) await sb.from("ai_events").insert({ suggestion_id: data.id, event_type: "proposed", actor: user.id, payload: { surface, source: "gemini" } });
  return { ok: true };
}

export async function disposeSuggestion(_: AiResult, formData: FormData): Promise<AiResult> {
  if (!enabled()) return { error: "AI dockets are feature-flagged off (FEATURE_AI_DOCKETS)." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const id = String(formData.get("suggestion_id") ?? "");
  const from = String(formData.get("from") ?? "").trim() as AiDisposition;
  const to = String(formData.get("to") ?? "").trim() as AiDisposition;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!isDispositionAllowed(from, to)) return { error: `Illegal disposition ${from} → ${to}.` };
  const decision = canDispose({ to, actor: user.id, reason });
  if (!decision.ok) return { error: decision.why };
  const { error, count } = await sb.from("ai_suggestions")
    .update({ disposition: to, disposed_by: user.id, disposed_reason: reason || null, disposed_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id).eq("disposition", from);
  if (error) { logProviderError("ai dispose", error); return { error: NEUTRAL_WRITE_ERROR }; }
  if (!count) return { error: "Disposition blocked — it may have changed since you loaded it." };
  await sb.from("ai_events").insert({ suggestion_id: id, event_type: "disposed", actor: user.id, payload: { to, reason } });
  return { ok: true };
}
