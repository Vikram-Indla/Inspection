"use server";
// Inspector daily/weekly briefing — auto-load + cache (TASK-FIELD-BRIEFING-AUTOLOAD-001).
// Sponsor-owned deviation (verbatim, overrides Figma default if one exists): the
// briefing must already be on the field dashboard on page load — no manual
// "Generate" click as the primary path — and must not re-call the AI provider
// on every page view. Regeneration cadence is once per Riyadh calendar day;
// a small explicit "Refresh" affordance stays available for the inspector to
// force a fresh one intraday.
//
// Cache: public.inspector_briefing_cache, keyed (user_id, scope, period_date).
// The generated text is ALSO recorded in public.ai_suggestions (surface
// "inspector_daily_briefing"), exactly as every other contextual-AI surface in
// this app does, so the existing "Review or reject this advisory" governance
// link (/ai/suggestions#ai-suggestion-{id}) keeps working unchanged.
//
// Governance carried over unchanged from lib/ai/contextual-actions.ts:
//  - AI is advisory only; it never writes a decision.
//  - The server re-reads the inspector's own RLS-scoped assignments; the
//    client never supplies source facts.
//  - Fail-closed: no provider key => "unavailable", nothing generated/stored.

import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getGeminiProvider } from "@/lib/providers/ai-gemini";
import { logProviderError } from "@/lib/neutral-error";

type SB = Awaited<ReturnType<typeof supabaseServer>>;

export type BriefingScope = "daily" | "weekly";

export type BriefingPayload = {
  text: string | null;
  insightId: string | null;
  cached: boolean;
  generatedAt: string | null; // ISO
  periodDate: string | null;  // Riyadh calendar date the entry is valid for
  error: string | null;       // set only when text is null and nothing was generated/stored
};

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Riyadh calendar date (YYYY-MM-DD) for the cache key — matches the existing
 *  "Daily Inspector Briefing" label's Asia/Riyadh framing used elsewhere on
 *  this page (see riyadhDate in field/page.tsx). */
function riyadhDateKey(ms: number): string {
  return new Date(ms + RIYADH_OFFSET_MS).toISOString().slice(0, 10);
}

// evidenceRefs shown to the end user were removed from the card per sponsor
// direction (internal traceability, not something an inspector needs to
// read); they are still recorded here for audit, exactly like every other
// contextual-AI surface's ai_suggestions.suggestion.evidence_refs.
const EVIDENCE_REFS_DAILY = ["MVP1-M03-001", "MVP1-M03-003", "MVP1-M03-009", "SCR-IPAD-600"];
const EVIDENCE_REFS_WEEKLY = ["MVP1-M03-001", "MVP1-M03-003", "MVP1-M03-009", "SCR-IPAD-600", "TASK-FIELD-BRIEFING-WEEKLY-001"];

// QA/seed fixture rows (synthetic factory names like "PLN-J expiry fixture
// 1784697187613" or "F360 Runtime 016 - J12 outbox isolation fixture") are
// real assignment data but never meant to reach an inspector-facing advisory
// — they're test scaffolding, not something worth summarizing. Filtered here,
// at the AI context boundary only; the underlying visit/assignment records
// and their real UI elsewhere are untouched.
const FIXTURE_NAME_PATTERN = /\bfixture\b|\brunt(ime)?\s*\d|golden journey|^inspector factory \d|^pln-j\b/i;
function dropFixtureRows(rows: AssignmentRow[]): AssignmentRow[] {
  return rows.filter((r) => !FIXTURE_NAME_PATTERN.test(r.visits?.factories?.name ?? ""));
}

type AssignmentRow = {
  visit_id: string;
  status: string;
  visits: {
    id: string;
    visit_type: string;
    execution_mode: string;
    planning_status: string;
    operational_state: string;
    window_start: string;
    window_end: string;
    priority: string | null;
    factories: { name: string; factory_code: string | null; city: string | null; region: string | null; risk_band: string | null; risk_score: number | null } | null;
  } | null;
};

async function fetchAssignments(sb: SB, userId: string, limit: number) {
  return sb.from("assignments")
    .select("visit_id, status, visits(id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, priority, factories(name, factory_code, city, region, risk_band, risk_score))")
    .eq("inspector_id", userId).order("created_at", { ascending: false }).limit(limit);
}

async function buildContext(sb: SB, userId: string, scope: BriefingScope, nowMs: number): Promise<{ context: string; error: string | null }> {
  if (scope === "daily") {
    // Same source query/shape as the pre-existing inspector_daily_briefing
    // surface in lib/ai/contextual-actions.ts — unchanged behaviour.
    const { data, error } = await fetchAssignments(sb, userId, 100);
    if (error) return { context: "", error: "Assignment source unavailable — no advisory was generated or stored." };
    return {
      context: JSON.stringify({
        generated_for: riyadhDateKey(nowMs),
        assigned_visits: dropFixtureRows((data ?? []) as unknown as AssignmentRow[]),
        route: "No routing geometry was supplied. Do not invent a route or travel order.",
        rule: "Summarize only. Do not alter assignment, priority, timing, visit state, geofence, inspection or risk truth.",
      }),
      error: null,
    };
  }
  // weekly — same query, wider (7-day) window, filtered server-side after read
  // (RLS already scopes rows to this inspector; the date filter here mirrors
  // the same window_start comparison the weekly KPI tiles use).
  const { data, error } = await fetchAssignments(sb, userId, 300);
  if (error) return { context: "", error: "Assignment source unavailable — no advisory was generated or stored." };
  const fromMs = nowMs - 6 * DAY_MS;
  const rows = (data ?? []) as unknown as AssignmentRow[];
  const weekRows = rows.filter((r) => {
    const start = r.visits?.window_start ? Date.parse(r.visits.window_start) : NaN;
    return Number.isFinite(start) && start >= fromMs - RIYADH_OFFSET_MS && start <= nowMs + DAY_MS;
  });
  return {
    context: JSON.stringify({
      generated_for_week: `${riyadhDateKey(fromMs)}..${riyadhDateKey(nowMs)}`,
      assigned_visits: dropFixtureRows(weekRows),
      route: "No routing geometry was supplied. Do not invent a route or travel order.",
      rule: "Summarize only the past 7 days. Do not alter assignment, priority, timing, visit state, geofence, inspection or risk truth.",
    }),
    error: null,
  };
}

async function readCache(sb: SB, userId: string, scope: BriefingScope, periodDate: string) {
  return sb.from("inspector_briefing_cache")
    .select("id, briefing_text, insight_id, created_at")
    .eq("user_id", userId).eq("scope", scope).eq("period_date", periodDate).maybeSingle();
}

/**
 * Returns the cached briefing for `scope` if one exists for today's Riyadh
 * date; otherwise generates it, stores it (ai_suggestions + cache), and
 * returns the fresh result. Pass `force: true` (the Refresh affordance) to
 * bypass the cache and always regenerate.
 */
export async function getOrGenerateBriefing(scope: BriefingScope, opts?: { force?: boolean }): Promise<BriefingPayload> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { text: null, insightId: null, cached: false, generatedAt: null, periodDate: null, error: "Session expired — sign in again." };

  const nowMs = Date.now();
  const periodDate = riyadhDateKey(nowMs);

  if (!opts?.force) {
    const { data: cached, error } = await readCache(sb, user.id, scope, periodDate);
    if (!error && cached) {
      return { text: cached.briefing_text, insightId: cached.insight_id, cached: true, generatedAt: cached.created_at, periodDate, error: null };
    }
  }

  const provider = getGeminiProvider();
  if (!provider) return { text: null, insightId: null, cached: false, generatedAt: null, periodDate, error: "AI provider unavailable — no advisory was generated or stored." };

  const { context, error: contextError } = await buildContext(sb, user.id, scope, nowMs);
  if (contextError) return { text: null, insightId: null, cached: false, generatedAt: null, periodDate, error: contextError };

  const generated = await provider.generateContextual("inspector_daily_briefing", context);
  if (!generated.ok || !generated.text) {
    return { text: null, insightId: null, cached: false, generatedAt: null, periodDate, error: `AI provider did not return a usable advisory (${generated.reason ?? "unknown"}).` };
  }

  const evidenceRefs = scope === "daily" ? EVIDENCE_REFS_DAILY : EVIDENCE_REFS_WEEKLY;
  const { data: suggestion, error: insertError } = await sb.from("ai_suggestions").insert({
    surface: "inspector_daily_briefing",
    target_type: "inspector_daily_briefing",
    target_ref: user.id,
    suggestion: {
      text: generated.text,
      source: "gemini",
      evidence_refs: evidenceRefs,
      confidence: null,
      confidence_status: "provider_not_supplied",
      advisory_contract: "contextual-ai-delta-v1",
      briefing_scope: scope,
      period_date: periodDate,
    },
    disposition: "proposed",
    provider_status: "configured",
  }).select("id, created_at").maybeSingle();
  if (insertError) {
    logProviderError("daily briefing insert", insertError);
    return { text: null, insightId: null, cached: false, generatedAt: null, periodDate, error: "The change could not be saved. Nothing was changed. Try again." };
  }

  const { error: cacheError } = await sb.from("inspector_briefing_cache").upsert({
    user_id: user.id,
    scope,
    period_date: periodDate,
    briefing_text: generated.text,
    insight_id: suggestion?.id ?? null,
    provider_status: "configured",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,scope,period_date" });
  if (cacheError) logProviderError("daily briefing cache upsert", cacheError); // non-fatal: text is already generated and recorded in ai_suggestions

  return { text: generated.text, insightId: suggestion?.id ?? null, cached: false, generatedAt: suggestion?.created_at ?? new Date().toISOString(), periodDate, error: null };
}

/** Server Action wrapper for the client "Refresh" icon button. */
export async function refreshBriefingAction(scope: BriefingScope): Promise<BriefingPayload> {
  return getOrGenerateBriefing(scope, { force: true });
}
