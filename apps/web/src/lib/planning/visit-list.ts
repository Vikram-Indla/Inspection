// SERVER-ONLY — canonical Planning visit-list query (PLN-REQ-012/013/014/015/017).
// One read contract behind /planning and the CSV export so list and export can
// never diverge. Imported only from Server Components and Server Actions.
//
// Tabs: All / Draft / Published / Returned / Cancelled / Expired. The internal
// engine state `validated` (between draft and published) is never a user tab —
// it is mapped INTO the Draft tab and its count.
//
// Search runs server-side across: visit_reference, visit id (exact uuid),
// internal reference, plan reference, CR number, licence number, factory name
// and inspector name. A cross-table or() cannot mix local and embedded
// columns in one PostgREST call, and folding large id sets into one in-()
// term overflows the gateway URL limit (~8 KB, observed as "fetch failed").
// So a searched list resolves in two honest steps, entirely server-side:
//   1. collect the COMPLETE set of matching visit ids per dimension
//      (paged; in-terms chunked at 100 ids to stay under the URL limit);
//   2. run the filtered/sorted queries against disjoint id chunks and merge.
// No dimension is silently truncated: a capped prequery would make matches
// disappear, which is exactly the fake-empty failure this module exists to
// prevent.
//
// Fail closed, but at the right granularity. A search-resolution or main-query
// error returns { ok: false }: without rows there is no list to show, and a
// failed read must never masquerade as an empty one. The six per-tab counts are
// separate — they fan out beside the row query and are the first thing to hit a
// statement timeout under load, so a count failure returns the rows with
// countsAvailable: false instead of blanking a page whose data already arrived.
// Callers must render the counts as unavailable in that case, never as 0.

import type { SupabaseClient } from "@supabase/supabase-js";
import { collectPostgrestPages } from "@/lib/supabase-pagination";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";

export const PLANNING_TABS = ["all", "draft", "pending_supervision", "published", "returned", "cancelled", "expired"] as const;
export type PlanningTab = (typeof PLANNING_TABS)[number];

export type PlanningListFilters = {
  method?: string;            // visit_plans.method (planning type)
  visitType?: string;
  executionMode?: string;     // visits.execution_mode (visit mode)
  region?: string;
  city?: string;
  inspectorId?: string;
  windowFrom?: string;        // YYYY-MM-DD — overlap semantics (window_end >= from)
  windowTo?: string;          // YYYY-MM-DD — overlap semantics (window_start <= to end-of-day)
  createdFrom?: string;       // YYYY-MM-DD
  createdTo?: string;         // YYYY-MM-DD
  packageVersionId?: string;
  priority?: string;
  bulkPlanRef?: string;       // visit_plans.plan_reference partial match
};

export type PlanningListParams = {
  tab: PlanningTab;
  search: string;
  filters: PlanningListFilters;
  sort: string;
  page: number;               // 1-based
  pageSize: number;
  // Planning's canonical list hides visits that have no governed human-readable
  // reference (see applyFilters). Visit Management manages those same visits
  // including immediate and freshly drafted ones, so it opts out rather than
  // losing rows it exists to act on. Defaults to Planning's behaviour.
  requireReference?: boolean;
};

export type PlanningVisitRow = {
  id: string;
  visitReference: string | null;
  visitPlanId: string | null; // null = immediate (no plan); the bulk-edit same-plan guard key
  method: string;             // plan method; "immediate" when the visit has no plan
  planReference: string | null;
  planningStatus: string;
  operationalState: string;
  visitType: string;
  executionMode: string;
  priority: string | null;
  factoryName: string | null;
  factoryCode: string | null;
  crNumber: string | null;
  licenseNumber: string | null;
  region: string | null;
  city: string | null;
  inspectorId: string | null;
  inspectorName: string | null;
  assignmentStatus: string | null;
  returnReason: string | null;
  windowStart: string;
  windowEnd: string;
  executionDate: string | null;   // inspections.started_at — null until execution begins
  inspectionStatus: string | null; // null = no inspection row yet; drives the "already started" guard
  packageTitles: string[];
  createdBy: string | null;
  createdAt: string;
  sourceChannel: string | null;
  internalReference: string | null;
};

export type PlanningListCounts = Record<PlanningTab, number>;

export type PlanningListResult =
  // countsAvailable is false when the tab-count queries failed but the list
  // itself loaded. The counts object is then meaningless and must not be
  // rendered as numbers — a failed count shown as 0 is a fabricated figure.
  | { ok: true; rows: PlanningVisitRow[]; counts: PlanningListCounts; countsAvailable: boolean; total: number; page: number; pageSize: number }
  | { ok: false };

// Sort whitelist — URL input is never interpolated into a column name.
const SORTS: Record<string, { column: "created_at" | "window_start" | "visit_reference" | "planning_status"; ascending: boolean }> = {
  created_desc: { column: "created_at", ascending: false },
  created_asc: { column: "created_at", ascending: true },
  window_asc: { column: "window_start", ascending: true },
  window_desc: { column: "window_start", ascending: false },
  reference_asc: { column: "visit_reference", ascending: true },
  status_asc: { column: "planning_status", ascending: true },
};
export const DEFAULT_PLANNING_SORT = "created_desc";
export const PLANNING_SORT_KEYS = Object.keys(SORTS);

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const SEARCH_ID_CAP = 500;      // per-dimension prequery bound (id-only reads, paged after)
const ID_CHUNK = 100;           // in-() chunk that keeps request URLs well under the gateway limit

/**
 * The shared non-production database also serves Playwright fixtures. Those
 * establishments must be excluded before the list query counts or paginates,
 * not only after rows reach the page. Post-filtering made the visible row count
 * disagree with the status tabs and "Showing … of …" total.
 *
 * Fixture recognition is deliberately centralized in field/fixtures so the
 * Planning list uses the same narrow names/codes as other customer-facing
 * workspaces. A failed factory read fails closed: showing a fixture as a real
 * visit, or reporting a count that includes one, is not an honest fallback.
 */
async function collectFixtureFactoryIds(sb: SupabaseClient): Promise<{ ok: true; ids: string[] } | { ok: false }> {
  const read = await collectPostgrestPages<{ id: string; name: string | null; factory_code: string | null }>((from, to) =>
    sb.from("factories").select("id, name, factory_code").order("id", { ascending: true }).range(from, to));
  if (read.error) {
    console.error("[planning.visit-list] fixture factory read failed:", read.error.message);
    return { ok: false };
  }
  return {
    ok: true,
    ids: (read.data ?? [])
      .filter(factory => isTestFixtureEstablishment(factory))
      // Factory ids are UUIDs in the canonical schema. Keeping this guard makes
      // the generated PostgREST in() term safe even if corrupt legacy data is
      // visible through RLS.
      .map(factory => factory.id)
      .filter(id => UUID_RE.test(id)),
  };
}

// Escape ilike wildcards (same pattern as planning/single/page.tsx); also strip
// characters that would break PostgREST or()/in-() group syntax.
const escLike = (q: string) => q.replace(/[(),"\\]/g, " ").replace(/[%_]/g, c => `\\${c}`).trim();

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Complete set of visit ids matching the general search term, across every
 * contract dimension. Local dimensions (visit_reference, internal_reference,
 * exact visit uuid) read directly; related dimensions (factory identity, plan
 * reference, inspector name) resolve to id sets first, then to visit ids.
 */
async function collectSearchVisitIds(sb: SupabaseClient, search: string): Promise<{ ok: true; ids: string[] } | { ok: false }> {
  const term = search.trim();
  const like = `%${escLike(term)}%`;
  const matched = new Set<string>();
  const fail = (where: string, message: string | undefined) => {
    console.error(`[planning.visit-list] search resolution failed (${where}):`, message);
    return { ok: false as const };
  };

  const localParts = [`visit_reference.ilike.${like}`, `internal_reference.ilike.${like}`];
  if (UUID_RE.test(term)) localParts.push(`id.eq.${term}`);
  const local = await collectPostgrestPages<{ id: string }>((from, to) =>
    sb.from("visits").select("id").or(localParts.join(",")).range(from, to));
  if (local.error) return fail("local columns", local.error.message);
  for (const r of local.data ?? []) matched.add(r.id);

  const [factories, plans, inspectors] = await Promise.all([
    sb.from("factories").select("id").or(`name.ilike.${like},factory_code.ilike.${like},cr_number.ilike.${like},license_number.ilike.${like}`).limit(SEARCH_ID_CAP),
    sb.from("visit_plans").select("id").ilike("plan_reference", like).limit(SEARCH_ID_CAP),
    sb.from("profiles").select("user_id").ilike("full_name", like).limit(200),
  ]);
  if (factories.error) return fail("factories", factories.error.message);
  if (plans.error) return fail("visit_plans", plans.error.message);
  if (inspectors.error) return fail("profiles", inspectors.error.message);

  const addVisitIds = async (ids: string[], run: (idChunk: string[], from: number, to: number) => PromiseLike<{ data: { id?: string; visit_id?: string }[] | null; error: { message: string } | null }>, where: string) => {
    for (const idChunk of chunk(ids, ID_CHUNK)) {
      const page = await collectPostgrestPages<{ id?: string; visit_id?: string }>((from, to) => run(idChunk, from, to));
      if (page.error) return fail(where, page.error.message);
      for (const r of page.data ?? []) matched.add((r.id ?? r.visit_id) as string);
    }
    return null;
  };

  const factoryIds = (factories.data ?? []).map(r => r.id as string);
  const planIds = (plans.data ?? []).map(r => r.id as string);
  const inspectorIds = (inspectors.data ?? []).map(r => r.user_id as string);

  const factoryFail = await addVisitIds(factoryIds,
    (c, from, to) => sb.from("visits").select("id").in("factory_id", c).range(from, to), "visits by factory");
  if (factoryFail) return factoryFail;
  const planFail = await addVisitIds(planIds,
    (c, from, to) => sb.from("visits").select("id").in("visit_plan_id", c).range(from, to), "visits by plan");
  if (planFail) return planFail;
  const inspectorFail = await addVisitIds(inspectorIds,
    (c, from, to) => sb.from("assignments").select("visit_id").in("inspector_id", c).range(from, to), "assignments by inspector");
  if (inspectorFail) return inspectorFail;

  return { ok: true, ids: [...matched].sort() };
}

// Full row projection. Embedded filters only restrict parent rows when the
// embed is !inner, so embeds become inner exactly when a filter targets them.
function rowSelect(f: PlanningListFilters): string {
  const plans = f.method || f.bulkPlanRef ? "visit_plans!inner(method, plan_reference)" : "visit_plans(method, plan_reference)";
  const factories = f.region || f.city ? "factories!inner(name, factory_code, cr_number, license_number, region, city)" : "factories(name, factory_code, cr_number, license_number, region, city)";
  const assignments = f.inspectorId ? "assignments!inner(inspector_id, status, return_reason, profiles(full_name))" : "assignments(inspector_id, status, return_reason, profiles(full_name))";
  const packages = f.packageVersionId ? "visit_packages!inner(package_version_id, package_versions(id, packages(title)))" : "visit_packages(package_version_id, package_versions(id, packages(title)))";
  return `id, visit_reference, visit_plan_id, visit_type, execution_mode, planning_status, operational_state, priority, window_start, window_end, created_at, source_channel, internal_reference, cancellation_reason,
    ${plans}, ${factories}, ${assignments}, ${packages},
    profiles(full_name), inspections(started_at, status)`;
}

// Head-count projection: only the embeds the active filters need.
function countSelect(f: PlanningListFilters): string {
  const embeds: string[] = [];
  if (f.method || f.bulkPlanRef) embeds.push("visit_plans!inner(method)");
  if (f.region || f.city) embeds.push("factories!inner(region)");
  if (f.inspectorId) embeds.push("assignments!inner(inspector_id)");
  if (f.packageVersionId) embeds.push("visit_packages!inner(package_version_id)");
  return ["id", ...embeds].join(", ");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function applyFilters(query: any, tab: PlanningTab, filters: PlanningListFilters, requireReference = true) {
  // A visit without its governed human-readable reference is not a usable
  // planning record. Keep legacy/incomplete rows out of customer-facing lists
  // rather than exposing a database UUID or a meaningless fallback label.
  // Visit Management opts out: it acts ON those visits, so hiding them there
  // would remove the only surface that can correct them.
  let q = requireReference ? query.not("visit_reference", "is", null).neq("visit_reference", "") : query;
  if (tab === "draft") q = q.in("planning_status", ["draft", "validated"]); // validated folds into Draft — never a user tab
  else if (tab !== "all") q = q.eq("planning_status", tab);
  if (filters.method) q = q.eq("visit_plans.method", filters.method);
  if (filters.bulkPlanRef) q = q.ilike("visit_plans.plan_reference", `%${escLike(filters.bulkPlanRef)}%`);
  if (filters.visitType) q = q.eq("visit_type", filters.visitType);
  if (filters.executionMode) q = q.eq("execution_mode", filters.executionMode);
  if (filters.region) q = q.eq("factories.region", filters.region);
  if (filters.city) q = q.eq("factories.city", filters.city);
  if (filters.inspectorId) q = q.eq("assignments.inspector_id", filters.inspectorId);
  if (filters.windowFrom) q = q.gte("window_end", filters.windowFrom);
  if (filters.windowTo) q = q.lte("window_start", `${filters.windowTo}T23:59:59.999Z`);
  if (filters.createdFrom) q = q.gte("created_at", filters.createdFrom);
  if (filters.createdTo) q = q.lte("created_at", `${filters.createdTo}T23:59:59.999Z`);
  if (filters.packageVersionId) q = q.eq("visit_packages.package_version_id", filters.packageVersionId);
  if (filters.priority) q = q.eq("priority", filters.priority);
  return q;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type Joined = {
  id: string; factory_id: string; visit_reference: string | null; visit_plan_id: string | null;
  visit_type: string; execution_mode: string;
  planning_status: string; operational_state: string; priority: string | null;
  window_start: string; window_end: string; created_at: string;
  source_channel: string | null; internal_reference: string | null; cancellation_reason: string | null;
  visit_plans: { method: string; plan_reference: string | null } | null;
  factories: { name: string; factory_code: string | null; cr_number: string | null; license_number: string | null; region: string | null; city: string | null } | null;
  assignments: { inspector_id: string; status: string; return_reason: string | null; profiles: { full_name: string } | null }[] | null;
  visit_packages: { package_version_id: string; package_versions: { id: string; packages: { title: string } | null } | null }[] | null;
  profiles: { full_name: string } | null;      // created_by → profiles
  inspections: { started_at: string | null; status: string | null } | null;
};

function toRow(v: Joined): PlanningVisitRow {
  const asg = v.assignments?.[0];
  return {
    id: v.id,
    visitReference: v.visit_reference,
    visitPlanId: v.visit_plan_id,
    method: v.visit_plans?.method ?? "immediate",
    planReference: v.visit_plans?.plan_reference ?? null,
    planningStatus: v.planning_status,
    operationalState: v.operational_state,
    visitType: v.visit_type,
    executionMode: v.execution_mode,
    priority: v.priority,
    factoryName: v.factories?.name ?? null,
    factoryCode: v.factories?.factory_code ?? null,
    crNumber: v.factories?.cr_number ?? null,
    licenseNumber: v.factories?.license_number ?? null,
    region: v.factories?.region ?? null,
    city: v.factories?.city ?? null,
    inspectorId: asg?.inspector_id ?? null,
    inspectorName: asg?.profiles?.full_name ?? null,
    assignmentStatus: asg?.status ?? null,
    returnReason: asg?.return_reason ?? null,
    windowStart: v.window_start,
    windowEnd: v.window_end,
    executionDate: v.inspections?.started_at ?? null,
    inspectionStatus: v.inspections?.status ?? null,
    packageTitles: (v.visit_packages ?? [])
      .map(p => p.package_versions?.packages?.title)
      .filter((title): title is string => !!title),
    createdBy: v.profiles?.full_name ?? null,
    createdAt: v.created_at,
    sourceChannel: v.source_channel,
    internalReference: v.internal_reference,
  };
}

// Mirrors the DB sort for merged search chunks: ISO timestamps and plain text
// compare lexicographically; NULLS LAST ascending / NULLS FIRST descending
// (Postgres defaults), id ascending as the deterministic tiebreak.
function compareRows(sort: (typeof SORTS)[string]) {
  return (a: PlanningVisitRow, b: PlanningVisitRow) => {
    const key = sort.column === "created_at" ? "createdAt"
      : sort.column === "window_start" ? "windowStart"
        : sort.column === "visit_reference" ? "visitReference" : "planningStatus";
    const av = a[key] as string | null;
    const bv = b[key] as string | null;
    if (av == null && bv == null) return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    if (av == null) return sort.ascending ? 1 : -1;
    if (bv == null) return sort.ascending ? -1 : 1;
    if (av !== bv) return (av < bv ? -1 : 1) * (sort.ascending ? 1 : -1);
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

const emptyCounts = (): PlanningListCounts => ({ all: 0, draft: 0, pending_supervision: 0, published: 0, returned: 0, cancelled: 0, expired: 0 });

/**
 * Fixture ids are an operationally unbounded set in the shared non-production
 * database. Sending them all in one `not.in()` expression made an otherwise
 * valid Planning read exceed the gateway URL limit and fail with HTTP 414.
 *
 * Keep the database predicates to real governed filters, then remove fixtures
 * from rows in process. The row reader walks the underlying ordered result
 * until it has enough real rows for the requested page. Counts use the same
 * filter contract and subtract fixture rows locally, so the list, tab badges,
 * and total remain consistent without sending a giant URL.
 */
async function readVisibleRows(
  sb: SupabaseClient,
  params: PlanningListParams,
  sort: (typeof SORTS)[string],
  matchedIds: string[] | null,
  fixtureFactoryIds: Set<string>,
): Promise<{ ok: true; rows: PlanningVisitRow[] } | { ok: false }> {
  const fetchRows = async (ids: string[] | null, from: number, to: number) => {
    let query = applyFilters(sb.from("visits").select(rowSelect(params.filters)), params.tab, params.filters, params.requireReference);
    if (ids) query = query.in("id", ids);
    return query.order(sort.column, { ascending: sort.ascending }).order("id", { ascending: true }).range(from, to);
  };
  const real = (data: unknown[]) => (data as Joined[]).filter(row => !fixtureFactoryIds.has(row.factory_id));

  if (matchedIds) {
    const reads = await Promise.all(chunk(matchedIds, ID_CHUNK).map(ids => fetchRows(ids, 0, ID_CHUNK - 1)));
    const failure = reads.find(read => read.error);
    if (failure?.error) {
      console.error("[planning.visit-list] row query failed:", failure.error.message);
      return { ok: false };
    }
    const rows = reads.flatMap(read => real((read.data ?? []) as unknown[])).map(toRow);
    rows.sort(compareRows(sort));
    return { ok: true, rows: rows.slice((params.page - 1) * params.pageSize, params.page * params.pageSize) };
  }

  const required = params.page * params.pageSize;
  const visible: Joined[] = [];
  const sourcePageSize = Math.max(100, params.pageSize);
  for (let from = 0; ; from += sourcePageSize) {
    const read = await fetchRows(null, from, from + sourcePageSize - 1);
    if (read.error) {
      console.error("[planning.visit-list] row query failed:", read.error.message);
      return { ok: false };
    }
    const sourceRows = (read.data ?? []) as unknown as Joined[];
    visible.push(...real(sourceRows));
    if (sourceRows.length < sourcePageSize || visible.length >= required) break;
  }
  return { ok: true, rows: visible.slice((params.page - 1) * params.pageSize, params.page * params.pageSize).map(toRow) };
}

async function countFixtureRows(
  sb: SupabaseClient,
  tab: PlanningTab,
  filters: PlanningListFilters,
  idChunks: (string[] | null)[],
  fixtureFactoryIds: Set<string>,
  requireReference: boolean | undefined,
): Promise<number | null> {
  let count = 0;
  for (const ids of idChunks) {
    const read = await collectPostgrestPages<{ factory_id: string }>((from, to) => {
      let query = applyFilters(sb.from("visits").select("factory_id"), tab, filters, requireReference);
      if (ids) query = query.in("id", ids);
      return query.range(from, to);
    });
    if (read.error) {
      console.error("[planning.visit-list] fixture count failed:", read.error.message);
      return null;
    }
    count += (read.data ?? []).filter(row => fixtureFactoryIds.has(row.factory_id)).length;
  }
  return count;
}

export async function queryPlanningVisits(sb: SupabaseClient, params: PlanningListParams): Promise<PlanningListResult> {
  const sort = SORTS[params.sort] ?? SORTS[DEFAULT_PLANNING_SORT];
  const page = Math.max(1, Math.floor(params.page) || 1);
  const pageSize = Math.min(Math.max(1, Math.floor(params.pageSize) || 25), 5000);

  const fixtures = await collectFixtureFactoryIds(sb);
  if (!fixtures.ok) return { ok: false };

  // Step 1 (only when searching): complete matching id set across all dimensions.
  let matchedIds: string[] | null = null;
  if (params.search.trim()) {
    const resolved = await collectSearchVisitIds(sb, params.search);
    if (!resolved.ok) return { ok: false };
    matchedIds = resolved.ids;
    if (matchedIds.length === 0) {
      return { ok: true, rows: [], counts: emptyCounts(), countsAvailable: true, total: 0, page: 1, pageSize };
    }
  }

  // Step 2: filtered queries — a single call without search, or disjoint
  // id-chunk calls merged in memory when a search resolved an id set.
  const idChunks = matchedIds ? chunk(matchedIds, ID_CHUNK) : [null];
  const fixtureFactoryIds = new Set(fixtures.ids);

  const [rowRead, countResults, fixtureCounts] = await Promise.all([
    readVisibleRows(sb, { ...params, page, pageSize }, sort, matchedIds, fixtureFactoryIds),
    Promise.all(idChunks.flatMap(ids =>
      PLANNING_TABS.map(tab =>
        (ids
          ? applyFilters(sb.from("visits").select(countSelect(params.filters), { count: "exact", head: true }), tab, params.filters, params.requireReference).in("id", ids)
          : applyFilters(sb.from("visits").select(countSelect(params.filters), { count: "exact", head: true }), tab, params.filters, params.requireReference)),
      ),
    )),
    Promise.all(PLANNING_TABS.map(tab => countFixtureRows(sb, tab, params.filters, idChunks, fixtureFactoryIds, params.requireReference))),
  ]);

  const failedCount = countResults.find(c => c.error);
  // The list and the tab counts fail independently. Six exact counts fan out
  // beside the row query, so under load the counts are what hit the statement
  // timeout first — and treating that as a total failure blanked a page whose
  // rows had already come back. Only a row failure is fatal now; a count
  // failure degrades to "counts unavailable" and the list still renders.
  if (!rowRead.ok) return { ok: false };
  const countsAvailable = !failedCount?.error && fixtureCounts.every((count): count is number => count !== null);
  if (!countsAvailable) {
    console.error("[planning.visit-list] tab counts unavailable:", failedCount?.error?.message);
  }

  const counts = emptyCounts();
  PLANNING_TABS.forEach((tab, i) => {
    const rawCount = idChunks.reduce((sum, _c, ci) => sum + (countResults[ci * PLANNING_TABS.length + i].count ?? 0), 0);
    counts[tab] = Math.max(0, rawCount - (fixtureCounts[i] ?? 0));
  });

  const rows = rowRead.rows;
  // With counts unavailable there is no honest total for the active tab, so the
  // row query's own count is used and, failing that, the rows actually returned.
  const total = countsAvailable ? counts[params.tab] : rows.length;
  return { ok: true, rows, counts, countsAvailable, total, page, pageSize };
}

/**
 * Latest lifecycle event per visit (the only honest "last update" signal —
 * visits has no updated_at column). Visits without lifecycle events get no
 * entry; callers render an empty cell rather than fabricating a timestamp.
 * A failed read returns the partial map and logs; it never blocks the list.
 */
export async function fetchLastUpdates(sb: SupabaseClient, visitIds: string[]): Promise<Record<string, string>> {
  const latest: Record<string, string> = {};
  for (const idChunk of chunk(visitIds, 500)) {
    if (idChunk.length === 0) break;
    const page = await collectPostgrestPages<{ visit_id: string; created_at: string }>((from, to) =>
      sb.from("visit_lifecycle_events").select("visit_id, created_at")
        .in("visit_id", idChunk).order("created_at", { ascending: false }).range(from, to),
    );
    if (page.error) {
      console.error("[planning.visit-list] lifecycle read failed:", page.error.message);
      return latest;
    }
    for (const row of page.data ?? []) {
      if (!latest[row.visit_id]) latest[row.visit_id] = row.created_at; // ordered desc — first seen is latest
    }
  }
  return latest;
}
