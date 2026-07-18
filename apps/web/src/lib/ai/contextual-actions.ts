"use server";

import { getVerifiedUser } from "@/lib/verified-user";
import { supabaseServer } from "@/lib/supabase-server";
import { getGeminiProvider } from "@/lib/providers/ai-gemini";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type ContextualSurface = "planning_summary" | "preparation_assistant";
export type ContextualResult = { ok?: boolean; error?: string; text?: string; insightId?: string; providerStatus?: string };

const parseRefs = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 30);

export async function generateContextualInsight(_: ContextualResult, formData: FormData): Promise<ContextualResult> {
  const surface = String(formData.get("surface") ?? "") as ContextualSurface;
  if (surface !== "planning_summary" && surface !== "preparation_assistant") return { error: "Unsupported advisory surface." };
  const clientContext = String(formData.get("context") ?? "").trim();
  const evidenceRefs = parseRefs(formData.get("evidence_refs"));
  const targetRef = String(formData.get("target_ref") ?? "").trim() || null;
  if (!clientContext) return { error: "Authoritative source facts are required." };
  if (!evidenceRefs.length) return { error: "At least one evidence reference is required." };
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "Session expired — sign in again." };
  const provider = getGeminiProvider();
  if (!provider) return { error: "AI provider unavailable — no advisory was generated or stored." };
  // Re-read the authoritative source under the caller's RLS scope. The hidden
  // client context is never trusted as a source of truth.
  let serverContext = clientContext;
  if (surface === "planning_summary") {
    const { data: factories, error } = await sb.from("factories").select("id, region, risk_band, source_synced_at").limit(1000);
    if (error) return { error: "Factory registry unavailable — no advisory was generated or stored." };
    const rows = factories ?? [];
    const counts = (key: "region" | "risk_band") => rows.reduce<Record<string, number>>((acc, row) => {
      const value = typeof row[key] === "string" && row[key].trim() ? row[key] : "unknown";
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});
    serverContext = JSON.stringify({ factories: rows.length, risk_band_counts: counts("risk_band"), region_counts: counts("region"), source: "RLS-scoped factory registry", client_scope_hint: clientContext.slice(0, 500) });
  } else if (surface === "preparation_assistant") {
    if (!targetRef) return { error: "A visit reference is required for preparation assistance." };
    const { data: visit, error } = await sb.from("visits").select("id, window_start, window_end, execution_mode, visit_type, priority, notes, planning_status, planner_lat, planner_lng, factories(name, factory_code, city, region, risk_band, risk_score), package_versions(version_label, packages(code))").eq("id", targetRef).maybeSingle();
    if (error || !visit) return { error: "Visit source unavailable — no advisory was generated or stored." };
    serverContext = JSON.stringify({ visit, route: "Use Mapbox/recorded route only when available; otherwise state unavailable.", rule: "Do not change visit state, assignment, geofence, route or inspection answers." });
  }
  const generated = await provider.generateContextual(surface, serverContext);
  if (!generated.ok || !generated.text) return { error: `AI provider did not return a usable advisory (${generated.reason ?? "unknown"}).` };
  const { data, error } = await sb.from("ai_suggestions").insert({
    surface,
    target_type: surface === "planning_summary" ? "bulk_plan_review" : "visit_prestart",
    target_ref: targetRef,
    suggestion: {
      text: generated.text,
      source: "gemini",
      evidence_refs: evidenceRefs,
      confidence: null,
      confidence_status: "provider_not_supplied",
      advisory_contract: "contextual-ai-delta-v1",
    },
    disposition: "proposed",
    provider_status: "configured",
  }).select("id").maybeSingle();
  if (error) { logProviderError("contextual ai insert", error); return { error: NEUTRAL_WRITE_ERROR }; }
  return { ok: true, text: generated.text, insightId: data?.id ?? undefined, providerStatus: "configured" };
}
