"use server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { isPlausibleDate } from "@/lib/plausible-date";
import { getWindowCapacity } from "@/lib/execution";
import { getPlanningAccess } from "@/lib/planning/access";
import { parseCt, hasCriteria } from "./criteria";

// CD-025 (SCR-WEB-150 / P03): publish no longer hard-redirects. It returns the
// authoritative result so the review workspace can render the success state
// (S26) — the created plan ID drives the optional read-only plan link, and the
// primary destination stays "Go to visits". A rolled-back publish returns an
// error and is never presented as success (P03 all-or-nothing).
export type DroppedRow = { id: string; name: string; reasons: EligibilityReason[] };
// M7 / PLN-CON-007 — publish commits ONLY the explicitly accepted eligible
// subset: the action re-computes the M6 eligibility partition for the
// submitted ids, DROPS rows that became ineligible between preview and commit
// and names every dropped row in the result ledger (never silently included,
// never silently dropped). `created` is the committed subset size.
export type BulkResult = { error?: string; ok?: boolean; planId?: string; dropped?: DroppedRow[]; created?: number };
export type BulkMutationResult = {
  error?: string;
  ok?: boolean;
  updatedCount?: number;
  visitIds?: string[];
  correlationId?: string;
};

// CD-025 readiness preview. Structured, locale-neutral blocker KINDS (the review
// workspace maps each kind to governed bilingual copy) plus recalculated counts.
// This is a PREVIEW for the ReadinessRail + consequence ledger; publish_bulk_plan
// re-checks every guard authoritatively inside its transaction and remains the
// source of truth. Kinds mirror STATE_MATRIX_CD-025 (dup/overlap/coverage/
// nopackage/packageInvalid/nopool/source failures).
export type BlockerKind =
  | "duplicate" | "overlap" | "coverage" | "capacity"
  | "nopackage" | "packageInvalid" | "nopool"
  | "configMissing" | "windowImplausible" | "srcFactory" | "srcPackage" | "srcInspector" | "srcDuplicate";
export type Blocker = { kind: BlockerKind; targets?: string[] };
// M6 — per-row eligibility partition. Every selected row is classified with
// machine-stable reason codes (the review workspace maps them to governed
// bilingual copy): the reviewer sees exactly WHICH rows would proceed and WHY
// the rest would not, before any publish attempt. Reasons are advisory
// previews; publish_bulk_plan re-validates authoritatively in its transaction.
export type EligibilityReason = "duplicate_active_visit" | "out_of_scope" | "missing_location" | "inspector_conflict";
export type EligibilityRow = { id: string; eligible: boolean; reasons: EligibilityReason[] };
export type EligibilityCounts = {
  total: number; eligible: number; ineligible: number; toCreate: number;
  missingLocation: number; activeConflicts: number; manualOverrideRequired: number;
};
export type ValidateResult = {
  blockers: Blocker[];
  /** M7 / PLN-CON-003 — non-blocking honesty (e.g. zero packages selected:
      preparation chooses later). Warnings never gate publish. */
  warnings: Blocker[];
  selected: number; retained: number; dup: number; manual: number; auto: number;
  committable: boolean;
  rows: EligibilityRow[];
  ledger: EligibilityCounts;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// CD-021 — data for the P02 review step. The targeting screen (110) hands off a
// client-held selection of factory ids; the review route loads their summaries,
// the eligible inspector pool (M01-029) and published packages, all RLS-scoped
// (no privileged bypass). Duplicate active periodic visits are flagged so the
// reviewer sees them before publishing (M02-012).
export type ReviewFactory = {
  id: string; factory_code: string; name: string; cr_number: string;
  city: string | null; region: string | null; risk_band: string | null; risk_score: number | null; dup: boolean;
};
export type ReviewInspector = { user_id: string; full_name: string };
export type ReviewPackage = { id: string; version_label: string; code: string };

// CD-024 (SCR-WEB-140 / P02) — fail-closed structured read result. Every source
// read reports success/failure/not-evaluated so the review UI + Assignment
// Evidence Ledger can render "not evaluated" and "unavailable" as named absences
// instead of silently collapsing a failed read into a false zero / "no conflict".
export type SourceState = "ok" | "failed" | "not-evaluated";
export type ReviewSources = { factories: SourceState; packages: SourceState; inspectors: SourceState; overlap: SourceState; lookups: SourceState };
// M7 — governed lookup option (planning_lookups); labels ship in both locales,
// the client picks by document locale with EN fallback.
export type LookupOption = { key: string; label_en: string; label_ar: string | null };
// CD-024 — selection-time overlap evidence for one inspector, from the SAME
// overlap query publishBulkPlan runs at submit (parity is a required test).
export type OverlapEvidence = {
  inspector_id: string;
  count: number;
  samples: { visit_id: string; window_start: string; window_end: string }[];
};

export type ReviewData = {
  factories: ReviewFactory[];
  packages: ReviewPackage[];
  inspectors: ReviewInspector[];
  unavailable?: boolean;
  /** Client-held IDs that are no longer readable in the caller's current scope. */
  missingFactoryIds?: string[];
  /** CD-024 — per-source fail-closed read state (R1-2). */
  sources?: ReviewSources;
  /** CD-024 — per-inspector active-assignment overlaps within the supplied window. */
  overlaps?: OverlapEvidence[];
  /** CD-024 — the window the overlap evidence was evaluated against (echoed). */
  window?: { start: string; end: string } | null;
  /** M7 — governed config options (visit_type / visit_mode / priority). */
  lookups?: { visitTypes: LookupOption[]; visitModes: LookupOption[]; priorities: LookupOption[] };
};

type OverlapRow = { inspector_id: string; visits: { id: string; window_start: string; window_end: string; planning_status: string } };

// CD-024 — ONE overlap query, TWO call sites (loadBulkSelection selection-time
// evidence + publishBulkPlan pre-RPC submit check). Existing active assignments
// whose visit window overlaps [window_start, window_end). Fail-closed: a query
// error returns { ok:false } so BOTH callers block rather than render "no
// conflict". This must stay byte-for-byte the same query in both places
// (parity test). NOTE: this is the pre-write check only — it can go stale before
// the assignment insert and the atomic RPC re-validates nothing (R1-1).
async function readOverlappingAssignments(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  inspectorIds: string[], window_start: string, window_end: string,
): Promise<{ ok: true; rows: OverlapRow[] } | { ok: false }> {
  const ids = [...new Set(inspectorIds)].filter(Boolean);
  if (!ids.length || !window_start || !window_end) return { ok: true, rows: [] };
  const { data, error } = await sb.from("assignments")
    .select("inspector_id, visits!inner(id, window_start, window_end, planning_status)")
    .in("inspector_id", ids)
    .in("visits.planning_status", ["draft", "published", "returned"])
    .lt("visits.window_start", window_end)
    .gt("visits.window_end", window_start);
  if (error) {
    console.error("[CD-024 overlap read]", error.message);
    return { ok: false };
  }
  return { ok: true, rows: (data ?? []) as unknown as OverlapRow[] };
}

export async function loadBulkSelection(ids: string[], window?: { start: string; end: string }): Promise<ReviewData> {
  const sb = await supabaseServer();
  // M6 — capability gate (planning.create.bulk). The review page gates
  // server-side too; this is defense-in-depth for the action surface. A
  // denial fails closed as "unavailable" (never a false empty catalog).
  const access = await getPlanningAccess(sb, ["planning.create.bulk"]);
  if (access.error || !access.can("planning.create.bulk")) {
    console.error("[CD-021 loadBulkSelection] access denied or resolution failed");
    return {
      factories: [], packages: [], inspectors: [], unavailable: true,
      sources: { factories: "failed", packages: "failed", inspectors: "failed", overlap: "not-evaluated", lookups: "failed" },
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  const clean = [...new Set(ids)].filter(id => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 500);
  if (clean.length === 0) return { factories: [], packages: [], inspectors: [] };
  const [factoryRead, packageRead, inspectorRead, lookupRead] = await Promise.all([
    sb.from("factories").select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, visits(planning_status, visit_type)").in("id", clean),
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
    // M7 — governed config options flow from planning_lookups, not hard-coded
    // lists; an unreadable lookup source is named "failed", never a false list.
    sb.from("planning_lookups").select("kind, key, label_en, label_ar, sort_order")
      .in("kind", ["visit_type", "visit_mode", "priority"]).eq("is_active", true).order("sort_order"),
  ]);
  if (factoryRead.error || packageRead.error || inspectorRead.error) {
    console.error("[CD-021 loadBulkSelection]", factoryRead.error?.message ?? packageRead.error?.message ?? inspectorRead.error?.message);
    // CD-024 R1-2 — fail closed with per-source truth. A failed read is NEVER
    // rendered as an empty catalog; the UI shows the specific source as
    // unavailable and blocks readiness with the caller's input preserved.
    return {
      factories: [], packages: [], inspectors: [], unavailable: true,
      sources: {
        factories: factoryRead.error ? "failed" : "ok",
        packages: packageRead.error ? "failed" : "ok",
        inspectors: inspectorRead.error ? "failed" : "ok",
        overlap: "not-evaluated",
        lookups: lookupRead.error ? "failed" : "ok",
      },
    };
  }
  const fac = factoryRead.data;
  const pkgs = packageRead.data;
  const inspRows = inspectorRead.data;
  const factories: ReviewFactory[] = (fac ?? []).map(f => {
    const visits = (f as unknown as { visits: { planning_status: string; visit_type: string }[] }).visits ?? [];
    // M6 — 'validated' is an internal ACTIVE plan state: a validated plan still
    // blocks a duplicate, exactly like draft/published/returned.
    const dup = visits.some(v => ["draft", "validated", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");
    return { id: f.id, factory_code: f.factory_code, name: f.name, cr_number: f.cr_number, city: f.city, region: f.region, risk_band: f.risk_band, risk_score: f.risk_score, dup };
  });
  // A successful RLS read can still return fewer rows than the client-held
  // selection when a factory was removed or left the caller's scope between
  // targeting and review. Preserve that fact explicitly; the review UI must
  // not treat it as an empty selection or silently publish the remaining rows.
  const foundFactoryIds = new Set(factories.map(f => f.id));
  const missingFactoryIds = clean.filter(id => !foundFactoryIds.has(id));
  const packages: ReviewPackage[] = (pkgs ?? []).map(p => ({ id: p.id, version_label: p.version_label, code: (p.packages as unknown as { code: string }).code }));
  // M7 — the embedded profiles join is NULL for personas the profiles_self RLS
  // policy does not cover (e.g. the Reviewer: business_staff with planning
  // capabilities but no planner role). A null join must never 500 the whole
  // selection load; fall back to the language-neutral id prefix, exactly the
  // pattern the conflict copy already uses for unnameable inspectors.
  const inspectors: ReviewInspector[] = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string } | null)?.full_name ?? r.user_id.slice(0, 8) }));

  // CD-024 — selection-time overlap evidence. When the caller supplies the
  // shared inspection window we run the SAME overlap query publish uses over the
  // whole eligible pool, so each manually chosen candidate can show its known
  // active-assignment overlaps (exact visit + window) BEFORE submit. Automatic
  // assignments are selected and overlap-checked inside publish_bulk_plan's
  // transaction; this preview therefore proves sufficient conflict-free
  // coverage without pretending to know the final automatic assignee.
  const startMs = window ? Date.parse(window.start) : Number.NaN;
  const endMs = window ? Date.parse(window.end) : Number.NaN;
  const windowOk = !!window && !!window.start && !!window.end && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  const sources: ReviewSources = { factories: "ok", packages: "ok", inspectors: "ok", overlap: "not-evaluated", lookups: lookupRead.error ? "failed" : "ok" };
  if (lookupRead.error) console.error("[CD-021 loadBulkSelection] lookups read failed:", lookupRead.error.message);
  const lookupRows = (lookupRead.data ?? []) as { kind: string; key: string; label_en: string; label_ar: string | null }[];
  const byKind = (kind: string): LookupOption[] => lookupRows.filter(r => r.kind === kind).map(r => ({ key: r.key, label_en: r.label_en, label_ar: r.label_ar }));
  const lookups = { visitTypes: byKind("visit_type"), visitModes: byKind("visit_mode"), priorities: byKind("priority") };
  let overlaps: OverlapEvidence[] = [];
  let windowEcho: { start: string; end: string } | null = null;
  if (windowOk) {
    windowEcho = { start: window!.start, end: window!.end };
    const ov = await readOverlappingAssignments(sb, inspectors.map(i => i.user_id), window!.start, window!.end);
    if (!ov.ok) {
      sources.overlap = "failed";
    } else {
      sources.overlap = "ok";
      const byInsp = new Map<string, OverlapEvidence>();
      for (const r of ov.rows) {
        const e = byInsp.get(r.inspector_id) ?? { inspector_id: r.inspector_id, count: 0, samples: [] };
        e.count += 1;
        if (e.samples.length < 3) e.samples.push({ visit_id: r.visits.id, window_start: r.visits.window_start, window_end: r.visits.window_end });
        byInsp.set(r.inspector_id, e);
      }
      overlaps = [...byInsp.values()];
    }
  }
  return { factories, packages, inspectors, missingFactoryIds, sources, overlaps, window: windowEcho, lookups };
}

// CD-021: neutral, catalogued failure copy. Raw Supabase/provider error text
// must NEVER reach the UI (it leaks schema/internal detail) — it is logged
// server-side and the operator sees governed language only.
// CD-025: no governed support/escalation destination exists — never invent one.
// Neutral, truthful, retry-only. All-or-nothing is stated so the operator knows
// the failure left no partial plan behind.
const NEUTRAL_PUBLISH_ERROR =
  "Publishing failed — the plan was not created and no visits were scheduled. " +
  "Nothing was published. Review the flagged items and try again.";
const NEUTRAL_READ_ERROR =
  "Planning data could not be verified (ERR-OPS-001). Nothing was published. Please try again.";

export async function publishBulkPlan(_: BulkResult, formData: FormData): Promise<BulkResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[CD-021 publishBulkPlan] auth read failed:", authError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!user) return { error: "Session expired." };
  // M7 — capability gate. The page stages with planning.create.bulk; PUBLISH
  // requires planning.publish, mirroring the RPC's widened guard
  // (has_role('planner') OR has_planning_capability('planning.publish') —
  // migration 20260721180000). Page, action and RPC now agree; the Reviewer
  // persona (business staff, publish capability, no planner role) publishes.
  const access = await getPlanningAccess(sb, ["planning.publish"]);
  if (access.error) {
    console.error("[CD-021 publishBulkPlan] access resolution failed");
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!access.can("planning.publish")) return { error: "Publishing requires the planning.publish capability (RBAC-007)." };
  let factoryIds = [...new Set(formData.getAll("factory_id").map(String))]
    .filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    .slice(0, 500);
  // M7 / PLN-CON-003 — zero-or-more packages. Every selection is passed to the
  // atomic publisher, which links its immutable snapshot in the same
  // transaction as the plan, visits, assignments and notifications.
  const package_version_ids = [...new Set(formData.getAll("package_version_id").map(String))]
    .filter(id => UUID_RE.test(id)).slice(0, 20);
  const window_start = String(formData.get("window_start") ?? "");
  const window_end = String(formData.get("window_end") ?? "");
  const visit_type = String(formData.get("visit_type") ?? "periodic");
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw === "" ? null : notesRaw;
  // M7 — governed priority (planning_lookups kind 'priority'); empty = unset.
  // The governed value is passed to the atomic publisher; no post-commit write.
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  // Manual per-visit inspector picks (M01-029): inspector_<factoryId> = user_id | "" (auto)
  const picks = new Map<string, string>();
  for (const fid of factoryIds) {
    const p = String(formData.get(`inspector_${fid}`) ?? "");
    if (p) picks.set(fid, p);
  }

  const blockers: string[] = [];
  if (factoryIds.length === 0) blockers.push("No factories selected — only selected targets proceed (M01-005)");
  if (visit_type !== "periodic") blockers.push("Visit type is not supported by this planning method (FLD-PLAN-003)");
  const startMs = Date.parse(window_start);
  const endMs = Date.parse(window_end);
  if (!window_start || !window_end || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) blockers.push("Invalid window (FLD-PLAN-005)");
  else if (!isPlausibleDate(window_start) || !isPlausibleDate(window_end)) blockers.push("Window date is outside the plausible range (DEF-DATA-005)");
  // M7 — zero packages allowed; every SELECTED version must still be active
  // (rows kept for the post-publish snapshot links).
  let packageRows: { id: string; version_label: string; status: string; packages: { code: string; title: string } | null }[] = [];
  if (package_version_ids.length) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: pvs, error: packageError } = await sb.from("package_versions")
      .select("id, version_label, status, packages(code, title)").in("id", package_version_ids)
      .in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`);
    if (packageError) {
      console.error("[CD-021 publishBulkPlan] package verification failed:", packageError.message);
      return { error: NEUTRAL_READ_ERROR };
    }
    packageRows = (pvs ?? []) as unknown as typeof packageRows;
    if (packageRows.length !== package_version_ids.length) blockers.push("A selected inspection checklist is no longer active (ERR-PUB-001)");
  }
  // M7 — priority must be a governed active lookup value when supplied.
  let priority: string | null = null;
  if (priorityRaw) {
    const { data: pr, error: prErr } = await sb.from("planning_lookups")
      .select("key").eq("kind", "priority").eq("is_active", true).eq("key", priorityRaw).maybeSingle();
    if (prErr) {
      console.error("[CD-021 publishBulkPlan] priority lookup read failed:", prErr.message);
      return { error: NEUTRAL_READ_ERROR };
    }
    if (!pr) blockers.push("Priority is not a governed value (PLN-CON-003)");
    else priority = priorityRaw;
  }

  // M7 / PLN-CON-007 — authoritative publish-time partition. The same four
  // ineligibility classes the M6 preview computes are re-evaluated for the
  // SUBMITTED ids; rows that became ineligible between the preview and this
  // commit are dropped and named in the result ledger. Nothing is silently
  // included and nothing is silently dropped.
  const { data: facRows, error: facErr } = await sb.from("factories")
    .select("id, factory_code, name, official_lat, official_lng").in("id", factoryIds);
  if (facErr) {
    console.error("[CD-021 publishBulkPlan] factory partition read failed:", facErr.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const facById = new Map((facRows ?? []).map(f => [f.id as string, f]));
  const label = (fid: string) => { const f = facById.get(fid); return f ? `${f.name} (${f.factory_code})` : fid.slice(0, 8); };

  // per-row duplicate check — M6: 'validated' is an internal ACTIVE state.
  const { data: dups, error: duplicateError } = await sb.from("visits").select("factory_id")
    .in("factory_id", factoryIds).eq("visit_type", visit_type).in("planning_status", ["draft", "validated", "published", "returned"]);
  if (duplicateError) {
    console.error("[CD-021 publishBulkPlan] duplicate read failed:", duplicateError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const dupSet = new Set((dups ?? []).map(d => d.factory_id as string));

  // inspectors pool (ENG-05 automatic; capacity checks deepen in B7)
  const { data: inspRows, error: inspectorError } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  if (inspectorError) {
    console.error("[CD-021 publishBulkPlan] inspector pool read failed:", inspectorError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const inspectors = (inspRows ?? []).map(r => r.user_id as string);
  if (!inspectors.length) blockers.push("No eligible inspector (P02 failure control)");
  const pool = new Set(inspectors);
  // One busy-set read serves BOTH the manual-pick conflict partition and the
  // automatic-coverage count. Fail closed: an unreadable check blocks
  // publishing, never "no conflict".
  const busyInspectors = new Set<string>();
  if (window_start && window_end) {
    const overlap = await readOverlappingAssignments(sb, inspectors, window_start, window_end);
    if (!overlap.ok) return { error: NEUTRAL_READ_ERROR };
    for (const r of overlap.rows) busyInspectors.add(r.inspector_id);
  }

  const dropped: DroppedRow[] = [];
  const kept: string[] = [];
  for (const fid of factoryIds) {
    const reasons: EligibilityReason[] = [];
    const fac = facById.get(fid);
    const pick = picks.get(fid) ?? "";
    if (!fac) reasons.push("out_of_scope");
    if (dupSet.has(fid)) reasons.push("duplicate_active_visit");
    if (fac && (fac.official_lat == null || fac.official_lng == null)) reasons.push("missing_location");
    if (pick && (!pool.has(pick) || busyInspectors.has(pick))) reasons.push("inspector_conflict");
    if (reasons.length) dropped.push({ id: fid, name: label(fid), reasons });
    else kept.push(fid);
  }
  if (factoryIds.length && kept.length === 0) {
    blockers.push(`Every selected row is ineligible at the authoritative re-check — nothing left to publish: ${dropped.map(d => `${d.name} (${d.reasons.join(", ")})`).join(" · ")}`);
  }
  // Manual picks ride with their rows; coverage counts the kept set only.
  for (const d of dropped) picks.delete(d.id);
  const manualTaken = new Set([...picks.values()]);
  const autoNeeded = kept.filter(fid => !picks.has(fid)).length;
  const freePool = [...pool].filter(i => !busyInspectors.has(i) && !manualTaken.has(i)).length;
  if (pool.size > 0 && autoNeeded > freePool) {
    blockers.push(`${autoNeeded - freePool} visit(s) have no eligible Inspector available in this window (M01-029) — widen the window or assign an Inspector manually`);
  }
  if (blockers.length) return { error: blockers.join(" · ") };

  // CD-021 / CR-002..010 / CR-020 / CR-031: publish_bulk_plan_atomic performs
  // every write — plan, visits, assignments, transitions, notifications,
  // package snapshots, priority and audit — in one SECURITY INVOKER
  // transaction. Any failure rolls the whole operation back.
  // M7 — the RPC commits EXACTLY the accepted eligible subset (kept).
  const manual: Record<string, string> = {};
  for (const [fid, insp] of picks) manual[fid] = insp;
  const { data: planId, error } = await sb.rpc("publish_bulk_plan_atomic", {
    p_factory_ids: kept,
    p_package_version_ids: package_version_ids,
    p_window_start: window_start,
    p_window_end: window_end,
    p_visit_type: visit_type,
    p_priority: priority,
    p_notes: notes,
    p_manual: manual,
    p_auto_pool: inspectors,
  });
  if (error) {
    // Log the real cause server-side; return catalogued neutral copy only.
    console.error("[CD-021] publish_bulk_plan_atomic failed:", error.message, error.code);
    // M7 — the in-transaction guards (RPC checks + the 0031 assignments
    // trigger, SQLSTATE 23505) rejected a conflict that appeared between the
    // preview and the commit. Name the conflicting rows honestly. The attempt
    // itself persists nowhere (the transaction rolled back and audit_events is
    // trigger/definer-only) — attempted-conflict audit needs a definer RPC
    // change and is a documented gap.
    if (error.code === "23505" || /duplicate active visit|inspector unavailable|window is no longer available/i.test(error.message ?? "")) {
      const parts: string[] = [];
      const { data: dupsNow } = await sb.from("visits").select("factory_id")
        .in("factory_id", kept).eq("visit_type", visit_type).in("planning_status", ["draft", "validated", "published", "returned"]);
      if (dupsNow?.length) {
        parts.push(`active visit conflict: ${[...new Set(dupsNow.map(d => label(d.factory_id as string)))].join(" · ")}`);
      }
      const chosenInspectors = [...new Set([...picks.values()])];
      if (chosenInspectors.length) {
        const overlapNow = await readOverlappingAssignments(sb, chosenInspectors, window_start, window_end);
        if (overlapNow.ok && overlapNow.rows.length) {
          const inspIds = [...new Set(overlapNow.rows.map(r => r.inspector_id))];
          const { data: names } = await sb.from("profiles").select("user_id, full_name").in("user_id", inspIds);
          const nameOf = new Map((names ?? []).map(n => [n.user_id as string, n.full_name as string]));
          parts.push(`inspector window conflict: ${inspIds.map(i => nameOf.get(i) ?? i.slice(0, 8)).join(" · ")}`);
        }
      }
      return {
        error: "Publishing failed — a conflicting visit or booking appeared at commit and the whole plan rolled back. Nothing was published."
          + (parts.length ? ` ${parts.join("; ")}.` : ""),
      };
    }
    // TASK-EXECUTION-MODULE-001 · D-009 — the publish RPC evaluated the shared
    // window capacity and found no selectable day for an assigned inspector.
    // Governed blocker copy in the same style as the blockers above; the
    // all-or-nothing rollback guarantee is stated exactly like the neutral copy.
    if (error.message?.includes("EXE-CAPACITY-WINDOW-FULL")) {
      return {
        error: "Publishing failed — no day in the window has remaining daily capacity for an assigned inspector. " +
          "Nothing was published. Widen the window or choose different assignments and try again (EXE-CAPACITY-WINDOW-FULL).",
      };
    }
    return { error: NEUTRAL_PUBLISH_ERROR };
  }
  // CD-025: the guarded publisher returns the new plan ID. Capture it so the
  // success state can offer the optional read-only plan link (S26). The plan ID
  // is only surfaced when actually returned; otherwise the link is omitted.
  // M7 — dropped rows + committed-subset size ride the result for the ledger.
  return { ok: true, planId: typeof planId === "string" ? planId : undefined, dropped, created: kept.length };
}

// CR-032/033/059/063/083..086 — the sole Planning action boundary for
// post-publication bulk configuration. The database RPC locks every target,
// requires Published + not-started state, applies the whole change atomically,
// writes one correlated audit event and persists an idempotent receipt.
export async function bulkUpdatePublishedVisits(
  _: BulkMutationResult,
  formData: FormData,
): Promise<BulkMutationResult> {
  const visitIds = [...new Set(formData.getAll("visit_id").map(String))]
    .filter(id => UUID_RE.test(id))
    .slice(0, 500);
  const submittedCount = formData.getAll("visit_id").length;
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const packageRaw = String(formData.get("package_version_id") ?? "").trim();
  const setPackage = String(formData.get("set_package") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim();
  const correlationRaw = String(formData.get("correlation_id") ?? "").trim();

  if (!visitIds.length || visitIds.length !== submittedCount) {
    return { error: "Select one or more valid visits. Duplicate or invalid targets are not allowed." };
  }
  if (!reason || reason.length > 1000) {
    return { error: "A governed bulk-change reason is required." };
  }
  if (!/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) {
    return { error: "The bulk-change idempotency key is missing or invalid." };
  }
  if (priorityRaw === "" && !setPackage) {
    return { error: "Choose at least one bulk change." };
  }
  if (packageRaw && !UUID_RE.test(packageRaw)) {
    return { error: "The selected inspection checklist is invalid." };
  }
  if (correlationRaw && !UUID_RE.test(correlationRaw)) {
    return { error: "The bulk-change correlation reference is invalid." };
  }

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[planning.bulk-update] auth read failed:", authError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!user) return { error: "Session expired." };

  const access = await getPlanningAccess(sb, ["planning.publish"]);
  if (access.error) return { error: NEUTRAL_READ_ERROR };
  if (!access.can("planning.publish")) {
    return { error: "This account cannot update published visits." };
  }

  const correlationId = correlationRaw || crypto.randomUUID();
  const { data, error } = await sb.rpc("bulk_update_published_visits", {
    p_visit_ids: visitIds,
    p_priority: priorityRaw || null,
    p_package_version_id: packageRaw || null,
    p_set_package: setPackage,
    p_reason: reason,
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error) {
    console.error("[planning.bulk-update] atomic mutation failed:", error.message, error.code);
    if (/PLANNING-BULK-INELIGIBLE/.test(error.message ?? "")) {
      return { error: "One or more visits changed, started, or left Published status. Nothing was updated." };
    }
    if (/PLANNING-BULK-IDEMPOTENCY-CONFLICT/.test(error.message ?? "")) {
      return { error: "This idempotency key was already used for a different bulk change. Nothing was updated." };
    }
    return { error: "The bulk change could not be completed. Nothing was updated. Review the visits and try again." };
  }

  const result = (data ?? {}) as {
    updated_count?: number;
    visit_ids?: string[];
    correlation_id?: string;
  };
  return {
    ok: true,
    updatedCount: result.updated_count ?? visitIds.length,
    visitIds: result.visit_ids ?? visitIds,
    correlationId: result.correlation_id ?? correlationId,
  };
}

// CD-025 — ReadinessRail + consequence-ledger preview. Recomputes duplicates,
// package validity, Inspector pool, manual eligibility/overlap, coverage and
// scope counts against live RLS-scoped data for the CURRENT working set (the
// ScopeReductionControl removes duplicate factory ids before calling this).
// Every check here is a preview; publish_bulk_plan re-runs all of them inside
// its transaction and is the authority. Read failures surface as distinct
// source-unavailable blockers (fail-closed, never a false "empty").
export async function validateBulkPlan(input: {
  ids: string[];
  /** M7 — zero-many packages; empty = preparation chooses later (warning). */
  package_version_ids: string[];
  window_start: string;
  window_end: string;
  visit_type: string;
  picks: Record<string, string>;
}): Promise<ValidateResult> {
  const sb = await supabaseServer();
  // M6 — capability gate (defense-in-depth; the review page gates server-side).
  // A denial throws: the client keeps its "checking" state and never renders a
  // false ready — fail-closed with the server-side log carrying the reason.
  const access = await getPlanningAccess(sb, ["planning.create.bulk"]);
  if (access.error || !access.can("planning.create.bulk")) {
    console.error("[CD-025 validate] access denied or resolution failed");
    throw new Error("planning.create.bulk capability required");
  }
  const blockers: Blocker[] = [];
  const warnings: Blocker[] = [];
  const ids = [...new Set((input.ids ?? []).map(String))].filter(id => UUID_RE.test(id)).slice(0, 500);
  const selected = ids.length;
  const done = (r: Partial<ValidateResult>): ValidateResult =>
    ({
      blockers, warnings, selected, retained: 0, dup: 0, manual: 0, auto: 0, committable: false,
      rows: [], ledger: { total: selected, eligible: 0, ineligible: selected, toCreate: 0, missingLocation: 0, activeConflicts: 0, manualOverrideRequired: 0 },
      ...r,
    });

  if (selected === 0) { blockers.push({ kind: "configMissing" }); return done({}); }

  const visit_type = input.visit_type || "periodic";
  const startMs = Date.parse(input.window_start);
  const endMs = Date.parse(input.window_end);
  const windowOk = !!input.window_start && !!input.window_end
    && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  if (!windowOk || visit_type !== "periodic") blockers.push({ kind: "configMissing" });
  else if (!isPlausibleDate(input.window_start) || !isPlausibleDate(input.window_end)) blockers.push({ kind: "windowImplausible" });

  // M7 / PLN-CON-003 — packages are zero-or-more. Zero selected is a WARNING
  // (the inspector chooses an eligible package during preparation), never a
  // hard blocker. A chosen version that is no longer active stays a hard
  // blocker — silently dropping a deliberate selection would be dishonest.
  const packageIds = [...new Set((input.package_version_ids ?? []).map(String))].filter(id => UUID_RE.test(id)).slice(0, 20);
  if (packageIds.length === 0) {
    warnings.push({ kind: "nopackage" });
  } else {
    const today = new Date().toISOString().slice(0, 10);
    const { data: pvs, error } = await sb.from("package_versions")
      .select("id").in("id", packageIds).in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`);
    if (error) { console.error("[CD-025 validate] package:", error.message); blockers.push({ kind: "srcPackage" }); }
    else if ((pvs ?? []).length !== packageIds.length) blockers.push({ kind: "packageInvalid" });
  }

  // factory existence + display names for blocker targets (+ official location
  // for the M6 missing-location eligibility reason)
  const { data: facRows, error: facErr } = await sb.from("factories").select("id, factory_code, name, official_lat, official_lng").in("id", ids);
  if (facErr) { console.error("[CD-025 validate] factories:", facErr.message); blockers.push({ kind: "srcFactory" }); return done({}); }
  const label = (fid: string) => { const f = (facRows ?? []).find(x => x.id === fid); return f ? `${f.name} (${f.factory_code})` : fid.slice(0, 8); };

  // duplicates (active periodic visit already exists)
  const { data: dups, error: dupErr } = await sb.from("visits").select("factory_id")
    .in("factory_id", ids).eq("visit_type", visit_type).in("planning_status", ["draft", "validated", "published", "returned"]);
  if (dupErr) { console.error("[CD-025 validate] duplicates:", dupErr.message); blockers.push({ kind: "srcDuplicate" }); }
  const dupSet = new Set((dups ?? []).map(d => d.factory_id));
  if (dupSet.size) blockers.push({ kind: "duplicate", targets: [...dupSet].map(label) });

  const retainedIds = ids.filter(id => !dupSet.has(id));
  const retained = retainedIds.length;

  // inspector pool
  const { data: inspRows, error: inspErr } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  if (inspErr) { console.error("[CD-025 validate] inspectors:", inspErr.message); blockers.push({ kind: "srcInspector" }); }
  const pool = new Set((inspRows ?? []).map(r => r.user_id));
  if (!inspErr && pool.size === 0) blockers.push({ kind: "nopool" });

  // manual picks on retained factories
  const picks = input.picks ?? {};
  const manualPicks = Object.entries(picks).filter(([fid, insp]) => retainedIds.includes(fid) && insp);
  const manual = manualPicks.length;
  const auto = Math.max(0, retained - manual);

  const overlapTargets = new Set<string>();
  // M6 — conflict evidence hoisted so the per-row eligibility partition can
  // reuse exactly what the blocker pass found (one source of truth).
  const busyInspectors = new Set<string>();
  const doubleBooked = new Set<string>();
  // same-plan double booking: one Inspector picked for >1 retained visit in the shared window
  const perInspector = new Map<string, string[]>();
  for (const [fid, insp] of manualPicks) perInspector.set(insp, [...(perInspector.get(insp) ?? []), fid]);
  for (const [insp, fids] of perInspector) if (fids.length > 1) { doubleBooked.add(insp); fids.forEach(fid => overlapTargets.add(label(fid))); }

  if (windowOk && manualPicks.length) {
    const chosen = [...perInspector.keys()];
    // eligibility: a manual pick outside the Inspector pool
    if (pool.size) for (const [fid, insp] of manualPicks) if (!pool.has(insp)) overlapTargets.add(label(fid));
    // existing active assignment overlapping this window (same query publish uses)
    const { data: conflicts, error: confErr } = await sb.from("assignments")
      .select("inspector_id, visits!inner(window_start, window_end, planning_status)")
      .in("inspector_id", chosen)
      .in("visits.planning_status", ["draft", "validated", "published", "returned"])
      .lt("visits.window_start", input.window_end)
      .gt("visits.window_end", input.window_start);
    if (confErr) { console.error("[CD-025 validate] overlap:", confErr.message); blockers.push({ kind: "srcInspector" }); }
    else {
      for (const c of conflicts ?? []) busyInspectors.add(c.inspector_id);
      for (const [fid, insp] of manualPicks) if (busyInspectors.has(insp)) overlapTargets.add(label(fid));
    }
  }
  if (overlapTargets.size) blockers.push({ kind: "overlap", targets: [...overlapTargets] });

  // D-009 — daily-cap preview for manual picks, from the SAME shared window
  // capacity service publish evaluates atomically. Best-effort: an unreadable
  // service (older schema) adds no blocker here — publish re-checks and its
  // EXE-CAPACITY-WINDOW-FULL failure is mapped at submit.
  if (windowOk && manualPicks.length) {
    const capped = new Set<string>();
    for (const insp of [...perInspector.keys()]) {
      const cap = await getWindowCapacity(sb, insp, input.window_start.slice(0, 10), input.window_end.slice(0, 10));
      if (cap.capacity && !cap.capacity.has_availability) capped.add(insp);
    }
    if (capped.size) {
      blockers.push({
        kind: "capacity",
        targets: manualPicks.filter(([, insp]) => capped.has(insp)).map(([fid]) => label(fid)),
      });
    }
  }

  // coverage: automatic visits each need a distinct Inspector free across the
  // shared window; manual picks consume their Inspector too.
  if (windowOk && auto > 0 && pool.size) {
    const { data: busyRows, error: busyErr } = await sb.from("assignments")
      .select("inspector_id, visits!inner(window_start, window_end, planning_status)")
      .in("visits.planning_status", ["draft", "validated", "published", "returned"])
      .lt("visits.window_start", input.window_end)
      .gt("visits.window_end", input.window_start);
    if (busyErr) { console.error("[CD-025 validate] coverage:", busyErr.message); blockers.push({ kind: "srcInspector" }); }
    else {
      const busy = new Set((busyRows ?? []).map(b => b.inspector_id));
      const manualTaken = new Set(manualPicks.map(([, insp]) => insp));
      const available = [...pool].filter(i => !busy.has(i) && !manualTaken.has(i)).length;
      if (available < auto) blockers.push({ kind: "coverage", targets: [String(auto - available)] });
    }
  }

  // M6 — per-row eligibility partition. Every selected row is classified with
  // stable reason codes; the acknowledgement flow in the review workspace may
  // then proceed with the eligible subset only, with every excluded row named.
  const facById = new Map((facRows ?? []).map(f => [f.id, f]));
  const rows: EligibilityRow[] = ids.map(id => {
    const reasons: EligibilityReason[] = [];
    const fac = facById.get(id);
    if (!fac) reasons.push("out_of_scope");
    if (dupSet.has(id)) reasons.push("duplicate_active_visit");
    if (fac && (fac.official_lat == null || fac.official_lng == null)) reasons.push("missing_location");
    const pick = (input.picks ?? {})[id];
    if (pick && (!pool.has(pick) || busyInspectors.has(pick) || doubleBooked.has(pick))) reasons.push("inspector_conflict");
    return { id, eligible: reasons.length === 0, reasons };
  });
  const ledger: EligibilityCounts = {
    total: selected,
    eligible: rows.filter(r => r.eligible).length,
    ineligible: rows.filter(r => !r.eligible).length,
    toCreate: rows.filter(r => r.eligible).length,
    missingLocation: rows.filter(r => r.reasons.includes("missing_location")).length,
    activeConflicts: rows.filter(r => r.reasons.includes("duplicate_active_visit") || r.reasons.includes("inspector_conflict")).length,
    manualOverrideRequired: rows.filter(r => r.reasons.includes("inspector_conflict")).length,
  };

  const committable = retained > 0 && blockers.length === 0;
  return { blockers, warnings, selected, retained, dup: dupSet.size, manual, auto, committable, rows, ledger };
}

// ---------------------------------------------------------------------------
// M6 — persisted bulk drafts (PLN-REQ-020/022 parity with saveSingleDraft).
// The targeting screen (criteria + selection) and the review workspace
// (selection + visit configuration + acknowledgement) both persist to ONE
// draft visit_plan row: method 'bulk', status 'draft', no notification, no
// publish, no status transition. The review route consumes it via
// /planning/bulk/review?plan=<id>. Optimistic draft_version compare makes
// concurrent saves fail closed instead of last-write-wins; only an own,
// active, still-draft bulk plan may be overwritten. RLS stays the boundary;
// the capability check (planning.edit_draft) mirrors the single-visit draft.
export type BulkDraftConfig = {
  picks?: Record<string, string>;
  package_version_id?: string;
  /** M7 — zero-many package selections (array wins over the legacy singular). */
  package_version_ids?: string[];
  window_start?: string;
  window_end?: string;
  notes?: string;
  /** M7 — governed priority key (planning_lookups); null/empty = unset. */
  priority?: string;
};
export type BulkDraftInput = {
  planId?: string;
  criteriaTree?: string; // wire-format `ct` payload; absent on review-only saves
  selection: string[];
  config?: BulkDraftConfig;
  validation?: unknown; // last readiness preview snapshot (advisory; re-run on resume)
  acknowledged?: boolean;
};
export type BulkDraftResult = { error?: string; planId?: string; planReference?: string; version?: number };

// source_channel is a provenance label, not an authorization input — bounded
// machine token, defaulting to this module's own channel (same as single).
const sanitizeBulkChannel = (raw: string) =>
  /^[a-z0-9][a-z0-9._-]{0,39}$/i.test(raw) ? raw : "planning.bulk";

export async function saveBulkDraft(input: BulkDraftInput): Promise<BulkDraftResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[PLN saveBulkDraft] auth read failed:", authError.message);
    return { error: "read" };
  }
  if (!user) return { error: "session" };
  const access = await getPlanningAccess(sb, ["planning.edit_draft", "planning.create.bulk"]);
  if (access.error || !access.can("planning.edit_draft")) {
    if (access.error) console.error("[PLN saveBulkDraft] access resolution failed");
    return { error: "denied" };
  }

  const selection = [...new Set((input?.selection ?? []).map(String))]
    .filter(id => UUID_RE.test(id)).slice(0, 500);
  if (selection.length === 0) return { error: "selection" };
  // When a criteria tree is supplied it must parse and contain at least one
  // usable condition — a draft records a real scope, never a match-all.
  let treeWire: unknown = null;
  if (input.criteriaTree != null && input.criteriaTree.trim() !== "") {
    const parsed = parseCt(input.criteriaTree);
    if (!parsed || !hasCriteria(parsed)) return { error: "criteria" };
    treeWire = JSON.parse(input.criteriaTree);
  }
  const cleanText = (v: string | undefined) => (v != null && v.trim() !== "" ? v.trim() : null);
  const picks: Record<string, string> = {};
  for (const [fid, insp] of Object.entries(input.config?.picks ?? {})) {
    if (UUID_RE.test(fid) && UUID_RE.test(insp) && selection.includes(fid)) picks[fid] = insp;
  }
  const packageIds = (input.config?.package_version_ids ?? (input.config?.package_version_id ? [input.config.package_version_id] : []))
    .filter(id => UUID_RE.test(id)).slice(0, 20);
  const draftPayload = {
    selection,
    config: {
      picks,
      package_version_id: packageIds[0] ?? null,
      package_version_ids: packageIds,
      window_start: cleanText(input.config?.window_start),
      window_end: cleanText(input.config?.window_end),
      notes: cleanText(input.config?.notes),
      priority: cleanText(input.config?.priority),
    },
    validation: input.validation ?? null,
    acknowledged: input.acknowledged === true,
  };
  const sourceChannel = sanitizeBulkChannel("planning.bulk");

  if (input.planId && UUID_RE.test(input.planId)) {
    const { data: current, error: currentError } = await sb.from("visit_plans")
      .select("id, draft_version")
      .eq("id", input.planId).eq("created_by", user.id)
      .eq("method", "bulk").eq("status", "draft").is("archived_at", null)
      .maybeSingle();
    if (currentError) {
      console.error("[PLN saveBulkDraft] draft read failed:", currentError.message);
      return { error: "read" };
    }
    if (!current) return { error: "unavailable" };
    const { data, error } = await sb.from("visit_plans")
      .update({ draft_payload: draftPayload, draft_version: (current.draft_version ?? 0) + 1, source_channel: sourceChannel, criteria: { method: "bulk", tree: treeWire } })
      .eq("id", current.id).eq("draft_version", current.draft_version ?? 0)
      .select("id, plan_reference, draft_version").single();
    if (error) {
      console.error("[PLN saveBulkDraft] draft update failed:", error.message);
      return { error: "write" };
    }
    return { planId: data.id, planReference: data.plan_reference, version: data.draft_version };
  }

  const { data, error } = await sb.from("visit_plans")
    .insert({
      method: "bulk",
      status: "draft",
      created_by: user.id,
      draft_payload: draftPayload,
      draft_version: 1,
      source_channel: sourceChannel,
      criteria: { method: "bulk", tree: treeWire },
    })
    .select("id, plan_reference, draft_version").single();
  if (error) {
    console.error("[PLN saveBulkDraft] draft insert failed:", error.message);
    return { error: "write" };
  }
  return { planId: data.id, planReference: data.plan_reference, version: data.draft_version };
}

// Load an own bulk draft for the review-resume route (?plan=<id>). Returns the
// persisted working state verbatim; every value is re-validated by the normal
// readiness preview after hydration (the snapshot is never trusted blindly).
export type BulkDraft = {
  planId: string; planReference: string; version: number;
  criteriaTree: string | null;
  selection: string[];
  config: {
    picks: Record<string, string>;
    /** M7 — zero-many packages; empty array = none selected (preparation hint). */
    package_version_ids: string[];
    window_start: string;
    window_end: string;
    notes: string;
    /** M7 — governed priority key; "" = unset. */
    priority: string;
  };
  acknowledged: boolean;
};
export type BulkDraftLoadResult = { error?: string; draft?: BulkDraft };

export async function loadBulkDraft(planId: string): Promise<BulkDraftLoadResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError) {
    console.error("[PLN loadBulkDraft] auth read failed:", authError.message);
    return { error: "read" };
  }
  if (!user) return { error: "session" };
  const access = await getPlanningAccess(sb, ["planning.create.bulk"]);
  if (access.error || !access.can("planning.create.bulk")) {
    if (access.error) console.error("[PLN loadBulkDraft] access resolution failed");
    return { error: "denied" };
  }
  if (!UUID_RE.test(planId)) return { error: "unavailable" };
  const { data, error } = await sb.from("visit_plans")
    .select("id, plan_reference, draft_version, criteria, draft_payload")
    .eq("id", planId).eq("created_by", user.id)
    .eq("method", "bulk").eq("status", "draft").is("archived_at", null)
    .maybeSingle();
  if (error) {
    console.error("[PLN loadBulkDraft] draft read failed:", error.message);
    return { error: "read" };
  }
  if (!data) return { error: "unavailable" };
  const payload = (data.draft_payload ?? {}) as {
    selection?: unknown;
    config?: { picks?: unknown; package_version_id?: unknown; package_version_ids?: unknown; window_start?: unknown; window_end?: unknown; notes?: unknown; priority?: unknown };
    acknowledged?: unknown;
  };
  const selection = (Array.isArray(payload.selection) ? payload.selection : [])
    .map(String).filter(id => UUID_RE.test(id)).slice(0, 500);
  const rawPicks = (payload.config?.picks ?? {}) as Record<string, unknown>;
  const picks: Record<string, string> = {};
  for (const [fid, insp] of Object.entries(rawPicks)) {
    if (UUID_RE.test(fid) && typeof insp === "string" && UUID_RE.test(insp)) picks[fid] = insp;
  }
  // M7 — array wins; legacy singular drafts hydrate as a one-element selection.
  const packageIds = Array.isArray(payload.config?.package_version_ids)
    ? (payload.config.package_version_ids as unknown[]).map(String).filter(id => UUID_RE.test(id)).slice(0, 20)
    : (typeof payload.config?.package_version_id === "string" && UUID_RE.test(payload.config.package_version_id)
        ? [payload.config.package_version_id] : []);
  const tree = (data.criteria as { tree?: unknown } | null)?.tree;
  return {
    draft: {
      planId: data.id,
      planReference: data.plan_reference,
      version: data.draft_version ?? 0,
      criteriaTree: tree ? JSON.stringify(tree) : null,
      selection,
      config: {
        picks,
        package_version_ids: packageIds,
        window_start: typeof payload.config?.window_start === "string" ? payload.config.window_start : "",
        window_end: typeof payload.config?.window_end === "string" ? payload.config.window_end : "",
        notes: typeof payload.config?.notes === "string" ? payload.config.notes : "",
        priority: typeof payload.config?.priority === "string" ? payload.config.priority : "",
      },
      acknowledged: payload.acknowledged === true,
    },
  };
}
