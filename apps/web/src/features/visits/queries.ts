import type { SupabaseClient } from "@supabase/supabase-js";
import {
  queryPlanningVisits, type PlanningListParams, type PlanningListCounts, type PlanningVisitRow,
} from "@/lib/planning/visit-list";
import { getPlanningAccess } from "@/lib/planning/access";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";

export type VisitLookupOption = { readonly key: string; readonly labelEn: string; readonly labelAr: string | null };

export type VisitReassignmentInspector = {
  readonly userId: string;
  readonly fullName: string;
  readonly eligibleVisitIds: readonly string[];
};

export type VisitManagementData = {
  readonly rows: readonly PlanningVisitRow[];
  readonly counts: PlanningListCounts;
  readonly countsAvailable: boolean;
  readonly total: number;
  readonly pageSize: number;
  readonly visitTypes: readonly VisitLookupOption[];
  readonly visitModes: readonly VisitLookupOption[];
  readonly regions: readonly string[];
  readonly cities: readonly string[];
  readonly inspectors: readonly VisitReassignmentInspector[];
  readonly reassignmentAvailable: boolean;
};

const ROSTER_CHUNK = 100;
const ROSTER_DENIED = "PLANNING-REASSIGN-ROSTER-DENIED";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const text = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const rows = (data: unknown): Record<string, unknown>[] =>
  Array.isArray(data) ? data.filter(isRecord) : [];

const distinct = (values: (string | null)[]): string[] =>
  [...new Set(values.filter((value): value is string => value !== null))].sort();

function toLookups(data: unknown, kind: string): VisitLookupOption[] {
  return rows(data)
    .filter(row => text(row, "kind") === kind)
    .map(row => ({ key: text(row, "key") ?? "", labelEn: text(row, "label_en") ?? "", labelAr: text(row, "label_ar") }))
    .filter(option => option.key.length > 0);
}

async function readReassignmentRoster(sb: SupabaseClient, visitIds: string[]): Promise<{
  available: boolean;
  inspectors: VisitReassignmentInspector[];
}> {
  const chunks = Array.from(
    { length: Math.ceil(visitIds.length / ROSTER_CHUNK) },
    (_unused, index) => visitIds.slice(index * ROSTER_CHUNK, index * ROSTER_CHUNK + ROSTER_CHUNK),
  );
  const results = await Promise.all(chunks.map(p_visit_ids =>
    sb.rpc("list_available_reassignment_inspectors", { p_visit_ids })));

  const byInspector = new Map<string, { userId: string; fullName: string; eligibleVisitIds: string[] }>();
  for (const result of results) {
    if (result.error) {
      if (!result.error.message.includes(ROSTER_DENIED)) {
        console.error(`[visits.reassignment-roster] load failed: ${result.error.message}`);
      }
      return { available: false, inspectors: [] };
    }
    for (const row of rows(result.data)) {
      const userId = text(row, "inspector_id");
      const visitId = text(row, "visit_id");
      if (!userId || !visitId) continue;
      const entry = byInspector.get(userId)
        ?? { userId, fullName: text(row, "full_name") ?? userId, eligibleVisitIds: [] };
      entry.eligibleVisitIds.push(visitId);
      byInspector.set(userId, entry);
    }
  }
  return {
    available: true,
    inspectors: [...byInspector.values()].sort((a, b) => a.fullName.localeCompare(b.fullName)),
  };
}

export async function queryVisitManagement(
  sb: SupabaseClient,
  params: PlanningListParams,
): Promise<VisitManagementData | null> {
  const region = params.filters.region;
  const [access, list, lookupsRead, regionsRead, citiesRead] = await Promise.all([
    getPlanningAccess(sb, ["planning.reassign"]),
    queryPlanningVisits(sb, params),
    sb.from("planning_lookups").select("kind, key, label_en, label_ar")
      .in("kind", ["visit_type", "visit_mode"]).eq("is_active", true).order("sort_order"),
    sb.from("factories").select("region").not("region", "is", null).limit(1000),
    region
      ? sb.from("factories").select("city").eq("region", region).not("city", "is", null).limit(1000)
      : sb.from("factories").select("city").not("city", "is", null).limit(1000),
  ]);

  const optionError = lookupsRead.error ?? regionsRead.error ?? citiesRead.error;
  if (optionError) console.error(`[visits.list] option read failed: ${optionError.message}`);
  if (!list.ok || optionError) return null;

  const visible = list.rows.filter(row => !isTestFixtureEstablishment({ name: row.factoryName }));
  const canReassign = !access.error && access.can("planning.reassign");
  const roster = canReassign && visible.length > 0
    ? await readReassignmentRoster(sb, visible.map(row => row.id))
    : { available: false, inspectors: [] };

  return {
    rows: visible,
    counts: list.counts,
    countsAvailable: list.countsAvailable,
    total: list.total,
    pageSize: list.pageSize,
    visitTypes: toLookups(lookupsRead.data, "visit_type"),
    visitModes: toLookups(lookupsRead.data, "visit_mode"),
    regions: distinct(rows(regionsRead.data).map(row => text(row, "region"))),
    cities: distinct(rows(citiesRead.data).map(row => text(row, "city"))),
    inspectors: roster.inspectors,
    reassignmentAvailable: roster.available,
  };
}

type CalendarRow = {
  id: string;
  visit_type: string;
  planning_status: string;
  operational_state: string;
  window_start: string;
  window_end: string;
  factories: { name: string } | null;
};

export type VisitCalendarRead =
  | { readonly ok: true; readonly rows: readonly CalendarRow[] }
  | { readonly ok: false; readonly reason: string };

export async function queryVisitCalendar(sb: SupabaseClient): Promise<VisitCalendarRead> {
  const { data, error } = await sb.from("visits")
    .select("id, visit_type, planning_status, operational_state, window_start, window_end, factories(name)")
    .order("window_start", { ascending: true })
    .limit(1000);
  if (error) return { ok: false, reason: error.message };
  return { ok: true, rows: (data ?? []) as unknown as CalendarRow[] };
}
