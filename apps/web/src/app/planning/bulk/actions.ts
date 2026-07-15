"use server";
import { supabaseServer } from "@/lib/supabase-server";

// CD-025 (SCR-WEB-150 / P03): publish no longer hard-redirects. It returns the
// authoritative result so the review workspace can render the success state
// (S26) — the created plan ID drives the optional read-only plan link, and the
// primary destination stays "Go to visits". A rolled-back publish returns an
// error and is never presented as success (P03 all-or-nothing).
export type BulkResult = { error?: string; ok?: boolean; planId?: string };

// CD-025 readiness preview. Structured, locale-neutral blocker KINDS (the review
// workspace maps each kind to governed bilingual copy) plus recalculated counts.
// This is a PREVIEW for the ReadinessRail + consequence ledger; publish_bulk_plan
// re-checks every guard authoritatively inside its transaction and remains the
// source of truth. Kinds mirror STATE_MATRIX_CD-025 (dup/overlap/coverage/
// nopackage/packageInvalid/nopool/source failures).
export type BlockerKind =
  | "duplicate" | "overlap" | "coverage"
  | "nopackage" | "packageInvalid" | "nopool"
  | "configMissing" | "srcFactory" | "srcPackage" | "srcInspector" | "srcDuplicate";
export type Blocker = { kind: BlockerKind; targets?: string[] };
export type ValidateResult = {
  blockers: Blocker[];
  selected: number; retained: number; dup: number; manual: number; auto: number;
  committable: boolean;
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
export type ReviewSources = { factories: SourceState; packages: SourceState; inspectors: SourceState; overlap: SourceState };
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
  const today = new Date().toISOString().slice(0, 10);
  const clean = [...new Set(ids)].filter(id => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 500);
  if (clean.length === 0) return { factories: [], packages: [], inspectors: [] };
  const [factoryRead, packageRead, inspectorRead] = await Promise.all([
    sb.from("factories").select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, visits(planning_status, visit_type)").in("id", clean),
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
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
      },
    };
  }
  const fac = factoryRead.data;
  const pkgs = packageRead.data;
  const inspRows = inspectorRead.data;
  const factories: ReviewFactory[] = (fac ?? []).map(f => {
    const visits = (f as unknown as { visits: { planning_status: string; visit_type: string }[] }).visits ?? [];
    const dup = visits.some(v => ["draft", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");
    return { id: f.id, factory_code: f.factory_code, name: f.name, cr_number: f.cr_number, city: f.city, region: f.region, risk_band: f.risk_band, risk_score: f.risk_score, dup };
  });
  // A successful RLS read can still return fewer rows than the client-held
  // selection when a factory was removed or left the caller's scope between
  // targeting and review. Preserve that fact explicitly; the review UI must
  // not treat it as an empty selection or silently publish the remaining rows.
  const foundFactoryIds = new Set(factories.map(f => f.id));
  const missingFactoryIds = clean.filter(id => !foundFactoryIds.has(id));
  const packages: ReviewPackage[] = (pkgs ?? []).map(p => ({ id: p.id, version_label: p.version_label, code: (p.packages as unknown as { code: string }).code }));
  const inspectors: ReviewInspector[] = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));

  // CD-024 — selection-time overlap evidence. When the caller supplies the
  // shared inspection window we run the SAME overlap query publish uses over the
  // whole eligible pool, so each candidate row can show its inspector's known
  // active-assignment overlaps (exact visit + window) BEFORE submit — the
  // asymmetry vs. auto (never overlap-checked) is surfaced by the UI, not hidden.
  const startMs = window ? Date.parse(window.start) : Number.NaN;
  const endMs = window ? Date.parse(window.end) : Number.NaN;
  const windowOk = !!window && !!window.start && !!window.end && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  const sources: ReviewSources = { factories: "ok", packages: "ok", inspectors: "ok", overlap: "not-evaluated" };
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
  return { factories, packages, inspectors, missingFactoryIds, sources, overlaps, window: windowEcho };
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
  const { data: { user }, error: authError } = await sb.auth.getUser();
  if (authError) {
    console.error("[CD-021 publishBulkPlan] auth read failed:", authError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!user) return { error: "Session expired." };
  const { data: plannerRole, error: plannerRoleError } = await sb.from("user_roles")
    .select("role_key").eq("user_id", user.id).eq("role_key", "planner").maybeSingle();
  if (plannerRoleError) {
    console.error("[CD-021 publishBulkPlan] planner role read failed:", plannerRoleError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  if (!plannerRole) return { error: "Authorized Planner role required (RBAC-007)." };
  let factoryIds = [...new Set(formData.getAll("factory_id").map(String))]
    .filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    .slice(0, 500);
  const package_version_id = String(formData.get("package_version_id") ?? "");
  const window_start = String(formData.get("window_start") ?? "");
  const window_end = String(formData.get("window_end") ?? "");
  const visit_type = String(formData.get("visit_type") ?? "periodic");
  const skipDuplicates = formData.get("skip_duplicates") === "1";
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw === "" ? null : notesRaw;
  // Manual per-visit inspector picks (M01-029): inspector_<factoryId> = user_id | "" (auto)
  const picks = new Map<string, string>();
  for (const fid of factoryIds) {
    const p = String(formData.get(`inspector_${fid}`) ?? "");
    if (p) picks.set(fid, p);
  }

  const blockers: string[] = [];
  if (factoryIds.length === 0) blockers.push("No factories selected — only selected targets proceed (M01-005)");
  if (visit_type !== "periodic") blockers.push("Visit type is not supported by this planning method (FLD-PLAN-003)");
  if (!package_version_id) blockers.push("No published package (ERR-PUB-001)");
  const startMs = Date.parse(window_start);
  const endMs = Date.parse(window_end);
  if (!window_start || !window_end || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) blockers.push("Invalid window (FLD-PLAN-005)");
  if (package_version_id) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: packageVersion, error: packageError } = await sb.from("package_versions")
      .select("id").eq("id", package_version_id).in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`).maybeSingle();
    if (packageError) {
      console.error("[CD-021 publishBulkPlan] package verification failed:", packageError.message);
      return { error: NEUTRAL_READ_ERROR };
    }
    if (!packageVersion) blockers.push("No published package (ERR-PUB-001)");
  }
  // per-row duplicate check (P01: duplicates flagged; conflicts listed, skip allowed)
  const { data: dups, error: duplicateError } = await sb.from("visits").select("factory_id")
    .in("factory_id", factoryIds).eq("visit_type", visit_type).in("planning_status", ["draft", "published", "returned"]);
  if (duplicateError) {
    console.error("[CD-021 publishBulkPlan] duplicate read failed:", duplicateError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const dupSet = new Set((dups ?? []).map(d => d.factory_id));
  if (dupSet.size) {
    if (skipDuplicates) {
      factoryIds = factoryIds.filter(fid => !dupSet.has(fid));
      if (factoryIds.length === 0) blockers.push("All selected factories have an active duplicate visit — nothing left to publish (M02-012)");
    } else {
      blockers.push(`${dupSet.size} selected factories already have an active ${visit_type} visit (M02-012) — deselect them or choose skip`);
    }
  }

  // inspectors pool (ENG-05 automatic; capacity checks deepen in B7)
  const { data: inspRows, error: inspectorError } = await sb.from("user_roles").select("user_id").eq("role_key", "inspector");
  if (inspectorError) {
    console.error("[CD-021 publishBulkPlan] inspector pool read failed:", inspectorError.message);
    return { error: NEUTRAL_READ_ERROR };
  }
  const inspectors = (inspRows ?? []).map(r => r.user_id);
  if (!inspectors.length) blockers.push("No eligible inspector (P02 failure control)");

  // Manual pick validation (M01-029): eligibility + same-window double-booking conflicts.
  const pool = new Set(inspectors);
  const chosen = [...new Set([...picks.values()])];
  for (const insp of chosen) {
    if (!pool.has(insp)) blockers.push(`Selected inspector is not in the eligible inspector pool (M01-029): ${insp.slice(0, 8)}`);
  }
  if (chosen.length && window_start && window_end) {
    // CD-024 — SAME overlap query as loadBulkSelection's selection-time evidence
    // (readOverlappingAssignments: one query, two call sites; parity is tested).
    // Fail closed: an unreadable check blocks publishing, never "no conflict".
    const overlap = await readOverlappingAssignments(sb, chosen, window_start, window_end);
    if (!overlap.ok) {
      return { error: NEUTRAL_READ_ERROR };
    }
    const conflicts = overlap.rows;
    if (conflicts.length) {
      const byInsp = new Map<string, number>();
      for (const c of conflicts) byInsp.set(c.inspector_id, (byInsp.get(c.inspector_id) ?? 0) + 1);
      const { data: names, error: namesError } = await sb.from("profiles").select("user_id, full_name").in("user_id", [...byInsp.keys()]);
      if (namesError) {
        console.error("[CD-021 publishBulkPlan] inspector name read failed:", namesError.message);
        return { error: NEUTRAL_READ_ERROR };
      }
      const nameOf = new Map((names ?? []).map(n => [n.user_id, n.full_name]));
      for (const [insp, n] of byInsp) {
        blockers.push(`${nameOf.get(insp) ?? insp.slice(0, 8)} is already booked on ${n} overlapping visit(s) in this window (M01-029 double-booking)`);
      }
    }
  }
  if (blockers.length) return { error: blockers.join(" · ") };

  // CD-021: atomic publish. publish_bulk_plan (migration 0026) performs every
  // write — plan, visits, assignments, draft->published transition,
  // notifications — inside one SECURITY INVOKER transaction. On any error the
  // whole operation rolls back: no plan, no visits, no half-published state
  // (P03 "partial publish prohibited"). RLS is still enforced because the
  // function runs as the calling planner.
  const manual: Record<string, string> = {};
  for (const [fid, insp] of picks) manual[fid] = insp;
  const { data: planId, error } = await sb.rpc("publish_bulk_plan", {
    p_factory_ids: factoryIds,
    p_package_version_id: package_version_id,
    p_window_start: window_start,
    p_window_end: window_end,
    p_visit_type: visit_type,
    p_notes: notes,
    p_manual: manual,
    p_auto_pool: inspectors,
  });
  if (error) {
    // Log the real cause server-side; return catalogued neutral copy only.
    console.error("[CD-021] publish_bulk_plan failed:", error.message, error.code);
    return { error: NEUTRAL_PUBLISH_ERROR };
  }
  // CD-025: the guarded publisher returns the new plan ID. Capture it so the
  // success state can offer the optional read-only plan link (S26). The plan ID
  // is only surfaced when actually returned; otherwise the link is omitted.
  return { ok: true, planId: typeof planId === "string" ? planId : undefined };
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
  package_version_id: string;
  window_start: string;
  window_end: string;
  visit_type: string;
  picks: Record<string, string>;
}): Promise<ValidateResult> {
  const sb = await supabaseServer();
  const blockers: Blocker[] = [];
  const ids = [...new Set((input.ids ?? []).map(String))].filter(id => UUID_RE.test(id)).slice(0, 500);
  const selected = ids.length;
  const done = (r: Partial<ValidateResult>): ValidateResult =>
    ({ blockers, selected, retained: 0, dup: 0, manual: 0, auto: 0, committable: false, ...r });

  if (selected === 0) { blockers.push({ kind: "configMissing" }); return done({}); }

  const visit_type = input.visit_type || "periodic";
  const startMs = Date.parse(input.window_start);
  const endMs = Date.parse(input.window_end);
  const windowOk = !!input.window_start && !!input.window_end
    && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  if (!windowOk || visit_type !== "periodic") blockers.push({ kind: "configMissing" });

  // package
  if (!input.package_version_id) {
    blockers.push({ kind: "nopackage" });
  } else {
    const today = new Date().toISOString().slice(0, 10);
    const { data: pv, error } = await sb.from("package_versions")
      .select("id").eq("id", input.package_version_id).in("status", ["published", "locked"])
      .lte("effective_from", today).or(`effective_to.is.null,effective_to.gte.${today}`).maybeSingle();
    if (error) { console.error("[CD-025 validate] package:", error.message); blockers.push({ kind: "srcPackage" }); }
    else if (!pv) blockers.push({ kind: "packageInvalid" });
  }

  // factory existence + display names for blocker targets
  const { data: facRows, error: facErr } = await sb.from("factories").select("id, factory_code, name").in("id", ids);
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
  // same-plan double booking: one Inspector picked for >1 retained visit in the shared window
  const perInspector = new Map<string, string[]>();
  for (const [fid, insp] of manualPicks) perInspector.set(insp, [...(perInspector.get(insp) ?? []), fid]);
  for (const [, fids] of perInspector) if (fids.length > 1) fids.forEach(fid => overlapTargets.add(label(fid)));

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
      const busy = new Set((conflicts ?? []).map(c => c.inspector_id));
      for (const [fid, insp] of manualPicks) if (busy.has(insp)) overlapTargets.add(label(fid));
    }
  }
  if (overlapTargets.size) blockers.push({ kind: "overlap", targets: [...overlapTargets] });

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

  const committable = retained > 0 && blockers.length === 0;
  return { blockers, selected, retained, dup: dupSet.size, manual, auto, committable };
}
