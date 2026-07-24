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
export type BriefingLocale = "en" | "ar";

// The dashboard renders in the inspector's active language (Arabic profile ⇒
// everything Arabic, including this AI-generated advisory). The cache row's
// briefing_text holds a { en, ar } JSON map so a single (user, scope, day)
// generation event serves BOTH languages — no schema change, no locale column.
// Legacy rows written before this (plain prose) are read as English.
type BriefingMap = Partial<Record<BriefingLocale, string>>;
function parseBriefingMap(raw: string | null): BriefingMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const map: BriefingMap = {};
      if (typeof parsed.en === "string") map.en = parsed.en;
      if (typeof parsed.ar === "string") map.ar = parsed.ar;
      if (map.en || map.ar) return map;
    }
  } catch { /* not JSON → legacy plain-text (English) */ }
  return { en: raw };
}
const LANG_RULE: Record<BriefingLocale, string> = {
  en: "Write the advisory in clear professional English.",
  ar: "اكتب الملخّص بالكامل باللغة العربية الفصحى الحديثة. يجب أن تكون كل جملة بالعربية؛ لا تستخدم الإنجليزية إطلاقًا باستثناء رموز/أكواد لا بديل لها. (Respond ENTIRELY in Modern Standard Arabic; no English prose.)",
};

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

async function buildContext(sb: SB, userId: string, scope: BriefingScope, nowMs: number, locale: BriefingLocale): Promise<{ context: string; error: string | null }> {
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
        output_language: LANG_RULE[locale],
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
      output_language: LANG_RULE[locale],
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

// Generate ONE language's advisory, record it in ai_suggestions (governance
// surface, unchanged), and return the text + insight id. No cache write here —
// the caller merges all generated languages into one cache row.
async function generateOne(
  sb: SB, userId: string, scope: BriefingScope, nowMs: number, periodDate: string, locale: BriefingLocale,
): Promise<{ text: string | null; insightId: string | null; error: string | null }> {
  const provider = getGeminiProvider();
  if (!provider) return { text: null, insightId: null, error: "AI provider unavailable — no advisory was generated or stored." };

  const { context, error: contextError } = await buildContext(sb, userId, scope, nowMs, locale);
  if (contextError) return { text: null, insightId: null, error: contextError };

  const generated = await provider.generateContextual("inspector_daily_briefing", context, locale);
  if (!generated.ok || !generated.text) {
    return { text: null, insightId: null, error: `AI provider did not return a usable advisory (${generated.reason ?? "unknown"}).` };
  }

  const evidenceRefs = scope === "daily" ? EVIDENCE_REFS_DAILY : EVIDENCE_REFS_WEEKLY;
  const { data: suggestion, error: insertError } = await sb.from("ai_suggestions").insert({
    surface: "inspector_daily_briefing",
    target_type: "inspector_daily_briefing",
    target_ref: userId,
    suggestion: {
      text: generated.text,
      source: "gemini",
      evidence_refs: evidenceRefs,
      confidence: null,
      confidence_status: "provider_not_supplied",
      advisory_contract: "contextual-ai-delta-v1",
      briefing_scope: scope,
      period_date: periodDate,
      locale,
    },
    disposition: "proposed",
    provider_status: "configured",
  }).select("id, created_at").maybeSingle();
  if (insertError) {
    logProviderError("daily briefing insert", insertError);
    return { text: null, insightId: null, error: "The change could not be saved. Nothing was changed. Try again." };
  }
  return { text: generated.text, insightId: suggestion?.id ?? null, error: null };
}

/**
 * Returns the cached briefing for `scope` in `locale` if one exists for today's
 * Riyadh date; otherwise generates it — and eagerly the other language too, so
 * both are ready — stores the { en, ar } map in one cache row, and returns the
 * requested-locale text. Pass `force: true` (Refresh) to always regenerate.
 */
export async function getOrGenerateBriefing(scope: BriefingScope, opts?: { force?: boolean; locale?: BriefingLocale }): Promise<BriefingPayload> {
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { text: null, insightId: null, cached: false, generatedAt: null, periodDate: null, error: "Session expired — sign in again." };

  const locale: BriefingLocale = opts?.locale === "ar" ? "ar" : "en";
  const other: BriefingLocale = locale === "ar" ? "en" : "ar";
  const nowMs = Date.now();
  const periodDate = riyadhDateKey(nowMs);

  const { data: cachedRow } = await readCache(sb, user.id, scope, periodDate);
  const map: BriefingMap = opts?.force ? {} : parseBriefingMap(cachedRow?.briefing_text ?? null);
  // Self-heal: a cached entry in the wrong script (e.g. an English string stored
  // under "ar" before the language directive was enforced) is treated as absent
  // so it regenerates in the correct language.
  const hasArabic = (s: string) => /[؀-ۿ]/.test(s);
  const rightScript = (loc: BriefingLocale, s: string) => (loc === "ar" ? hasArabic(s) : true);
  if (map.ar && !hasArabic(map.ar)) delete map.ar;
  if (map[locale] && rightScript(locale, map[locale]!)) {
    return { text: map[locale]!, insightId: cachedRow?.insight_id ?? null, cached: true, generatedAt: cachedRow?.created_at ?? null, periodDate, error: null };
  }

  // Generate the requested language; eagerly generate the other if it is not
  // already cached, so a later visit in that language is instant.
  const primary = await generateOne(sb, user.id, scope, nowMs, periodDate, locale);
  if (!primary.text) {
    return { text: null, insightId: null, cached: false, generatedAt: null, periodDate, error: primary.error };
  }
  map[locale] = primary.text;
  const primaryInsightId = primary.insightId;
  // Only the requested language is generated synchronously (one provider call,
  // so the dashboard is not blocked on two). The other language is generated
  // lazily on its first visit and merged into the same row — both end up cached
  // without ever blocking a single page load on two sequential AI calls.
  void other;

  const { error: cacheError } = await sb.from("inspector_briefing_cache").upsert({
    user_id: user.id,
    scope,
    period_date: periodDate,
    briefing_text: JSON.stringify(map),
    insight_id: primaryInsightId ?? cachedRow?.insight_id ?? null,
    provider_status: "configured",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,scope,period_date" });
  if (cacheError) logProviderError("daily briefing cache upsert", cacheError); // non-fatal: text already recorded in ai_suggestions

  return { text: map[locale]!, insightId: primaryInsightId, cached: false, generatedAt: new Date().toISOString(), periodDate, error: null };
}

/** Server Action wrapper for the client "Refresh" icon button. */
export async function refreshBriefingAction(scope: BriefingScope, locale?: BriefingLocale): Promise<BriefingPayload> {
  return getOrGenerateBriefing(scope, { force: true, locale });
}
