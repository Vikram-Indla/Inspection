"use server";

import { getVerifiedUser } from "@/lib/verified-user";
import { supabaseServer } from "@/lib/supabase-server";
import { getGeminiProvider } from "@/lib/providers/ai-gemini";
import { logProviderError, NEUTRAL_WRITE_ERROR } from "@/lib/neutral-error";

export type ContextualSurface = "planning_summary" | "preparation_assistant" | "inspection_item_explanation" | "factory_risk_explanation" | "inspector_daily_briefing" | "visit_management_summary";
export type ContextualResult = { ok?: boolean; error?: string; text?: string; insightId?: string; providerStatus?: string };

const parseRefs = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 30);

export async function generateContextualInsight(_: ContextualResult, formData: FormData): Promise<ContextualResult> {
  const surface = String(formData.get("surface") ?? "") as ContextualSurface;
  if (!["planning_summary", "preparation_assistant", "inspection_item_explanation", "factory_risk_explanation", "inspector_daily_briefing", "visit_management_summary"].includes(surface)) return { error: "Unsupported advisory surface." };
  const clientContext = String(formData.get("context") ?? "").trim();
  const evidenceRefs = parseRefs(formData.get("evidence_refs"));
  const targetRef = String(formData.get("target_ref") ?? "").trim() || null;
  const itemId = String(formData.get("item_id") ?? "").trim() || null;
  const locale = String(formData.get("locale") ?? "en") === "ar" ? "ar" : "en";
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
    if (error) return { error: "Factory list unavailable — no advisory was generated or stored." };
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
  } else if (surface === "inspection_item_explanation") {
    // M04-138: re-read the inspection, its frozen package and item under RLS.
    // The client may only request an explanation; it cannot supply the content.
    if (!targetRef || !itemId) return { error: "An inspection and item reference are required for this explanation." };
    const [{ data: inspection, error: inspectionError }, { data: item, error: itemError }, { data: response }, { data: evidence }] = await Promise.all([
      sb.from("inspections").select("id, package_versions(id, definition)").eq("id", targetRef).maybeSingle(),
      sb.from("inspection_items").select("id, code, title, guidance_en, guidance_ar, response_model, evidence_rule, regulation_clauses(clause_ref, legal_source)").eq("id", itemId).maybeSingle(),
      sb.from("checklist_responses").select("response").eq("inspection_id", targetRef).eq("item_id", itemId).maybeSingle(),
      sb.from("evidence").select("id, evidence_type").eq("inspection_id", targetRef).eq("linked_type", "item").eq("linked_id", itemId).limit(1000),
    ]);
    if (inspectionError || itemError || !inspection || !item) return { error: "Inspection-item source unavailable — no advisory was generated or stored." };
    const packageVersion = inspection.package_versions as unknown as { definition?: { sections?: { items?: string[] }[] } } | null;
    const packageItemCodes = (packageVersion?.definition?.sections ?? []).flatMap(section => section.items ?? []);
    if (!packageItemCodes.includes(item.code)) return { error: "The requested item is not in this inspection's locked package — no advisory was generated or stored." };
    const clause = item.regulation_clauses as unknown as { clause_ref: string; legal_source: string | null } | null;
    serverContext = JSON.stringify({
      inspection_id: inspection.id,
      item: {
        code: item.code,
        title: item.title,
        guidance: locale === "ar" ? item.guidance_ar : item.guidance_en,
        clause_ref: clause?.clause_ref ?? null,
        legal_source: clause?.legal_source ?? null,
        response_model: item.response_model,
        evidence_rule: item.evidence_rule,
      },
      current_answer: response?.response ?? null,
      captured_evidence: (evidence ?? []).map(row => row.evidence_type),
      rule: "Explain recorded configuration only. Do not recommend an inspection answer, legal conclusion, penalty, severity or licensing action.",
    });
  } else if (surface === "factory_risk_explanation") {
    // M07-014/015: the explanation is constrained to a persisted calculation
    // and its recorded drivers. It cannot recalculate or alter factory risk.
    if (!targetRef) return { error: "A factory reference is required for this risk explanation." };
    const [{ data: factory, error: factoryError }, { data: snapshots, error: snapshotError }] = await Promise.all([
      sb.from("factories").select("id, name, factory_code, risk_score, risk_band, risk_version, risk_drivers, risk_calculated_at").eq("id", targetRef).maybeSingle(),
      sb.from("factory_risk_snapshots").select("score, band, model_version, drivers, calculated_at").eq("factory_id", targetRef).order("calculated_at", { ascending: false }).limit(5),
    ]);
    if (factoryError || snapshotError || !factory) return { error: "Factory risk source unavailable — no advisory was generated or stored." };
    serverContext = JSON.stringify({
      factory: {
        id: factory.id, name: factory.name, factory_code: factory.factory_code,
        risk_score: factory.risk_score, risk_band: factory.risk_band,
        risk_version: factory.risk_version, risk_drivers: factory.risk_drivers,
        risk_calculated_at: factory.risk_calculated_at,
      },
      recent_recorded_snapshots: snapshots ?? [],
      rule: "Explain persisted score inputs only. Do not calculate, change or recommend a risk, enforcement, licensing or inspection outcome.",
    });
  } else if (surface === "inspector_daily_briefing") {
    // M03-001/003: the brief uses only the signed-in inspector's own RLS
    // assignments. It has no route engine and cannot alter visit/assignment truth.
    const { data: assignments, error } = await sb.from("assignments")
      .select("visit_id, status, visits(id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, priority, factories(name, factory_code, city, region, risk_band, risk_score))")
      .eq("inspector_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (error) return { error: "Assignment source unavailable — no advisory was generated or stored." };
    serverContext = JSON.stringify({
      generated_for: new Date().toISOString().slice(0, 10),
      assigned_visits: assignments ?? [],
      route: "No routing geometry was supplied. Do not invent a route or travel order.",
      rule: "Summarize only. Do not alter assignment, priority, timing, visit state, geofence, inspection or risk truth.",
    });
  } else {
    const { data: visits, error } = await sb.from("visits").select("id, planning_status, operational_state, window_start, window_end, visit_plan_id, factories(name, region, city)").order("window_start", { ascending: true }).limit(1000);
    if (error) return { error: "Visit-management source unavailable — no advisory was generated or stored." };
    const rows = visits ?? [];
    const count = (key: "planning_status" | "operational_state") => rows.reduce<Record<string, number>>((a, row) => { const v = row[key] || "unknown"; a[v] = (a[v] ?? 0) + 1; return a; }, {});
    serverContext = JSON.stringify({ visits: rows.length, planning_status_counts: count("planning_status"), operational_state_counts: count("operational_state"), rule: "Summarize recorded visit facts only. Do not reschedule, reassign, predict completion, change state or publish." });
  }
  const generated = await provider.generateContextual(surface, serverContext, locale);
  if (!generated.ok || !generated.text) return { error: `AI provider did not return a usable advisory (${generated.reason ?? "unknown"}).` };
  const { data, error } = await sb.from("ai_suggestions").insert({
    surface,
    target_type: surface === "planning_summary" ? "bulk_plan_review" : surface === "preparation_assistant" ? "visit_prestart" : surface === "inspection_item_explanation" ? "inspection_item" : surface === "factory_risk_explanation" ? "factory_risk_profile" : surface === "inspector_daily_briefing" ? "inspector_daily_briefing" : "visit_management_summary",
    target_ref: surface === "inspector_daily_briefing" ? user.id : targetRef,
    suggestion: {
      text: generated.text,
      source: "gemini",
      evidence_refs: evidenceRefs,
      confidence: null,
      confidence_status: "provider_not_supplied",
      advisory_contract: "contextual-ai-delta-v1",
      item_id: surface === "inspection_item_explanation" ? itemId : undefined,
    },
    disposition: "proposed",
    provider_status: "configured",
  }).select("id").maybeSingle();
  if (error) { logProviderError("contextual ai insert", error); return { error: NEUTRAL_WRITE_ERROR }; }
  return { ok: true, text: generated.text, insightId: data?.id ?? undefined, providerStatus: "configured" };
}
