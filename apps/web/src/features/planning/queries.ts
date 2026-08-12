import type { SupabaseClient } from "@supabase/supabase-js";
import {
  queryPlanningVisits, fetchLastUpdates,
  PLANNING_TABS, PLANNING_METHODS, DEFAULT_PLANNING_SORT, PLANNING_SORT_KEYS,
  type PlanningTab, type PlanningMethod, type PlanningListParams, type PlanningListCounts, type PlanningVisitRow,
} from "@/lib/planning/visit-list";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { readRows } from "@/lib/postgrest/read";
import type { Shape } from "@/lib/postgrest/shape";

export const PLANNING_PAGE_SIZE = 25;

export type PlanningSearchParams = Record<string, string | string[] | undefined>;

export type PlanningLookupOption = { key: string; labelEn: string; labelAr: string | null };

export type PlanningInspectorOption = { userId: string; label: string };

export type PlanningDraftPlan = {
  id: string;
  method: string;
  planReference: string | null;
  draftVersion: number;
  createdAt: string;
  createdBy: string;
  createdByName: string | null;
};

export type PlanningWorkspace =
  | { ok: false }
  | {
    ok: true;
    rows: PlanningVisitRow[];
    lastUpdates: Record<string, string>;
    counts: PlanningListCounts;
    countsAvailable: boolean;
    total: number;
    page: number;
    totalPages: number;
    visitTypes: PlanningLookupOption[];
    priorities: PlanningLookupOption[];
    regions: string[];
    cities: string[];
    inspectors: PlanningInspectorOption[];
    drafts: PlanningDraftPlan[];
    viewerId: string | null;
  };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export function parsePlanningParams(sp: PlanningSearchParams): PlanningListParams {
  const tabRaw = first(sp.tab);
  const tab: PlanningTab = (PLANNING_TABS as readonly string[]).includes(tabRaw) ? (tabRaw as PlanningTab) : "all";
  const sortRaw = first(sp.sort);
  const methodRaw = first(sp.method);
  const method: PlanningMethod | undefined = (PLANNING_METHODS as readonly string[]).includes(methodRaw)
    ? (methodRaw as PlanningMethod)
    : undefined;
  return {
    tab,
    search: first(sp.q).trim(),
    filters: {
      method,
      visitType: first(sp.visitType) || undefined,
      region: first(sp.region) || undefined,
      city: first(sp.city) || undefined,
      inspectorId: first(sp.inspectorId) || undefined,
      windowFrom: first(sp.windowFrom) || undefined,
      windowTo: first(sp.windowTo) || undefined,
      createdFrom: first(sp.createdFrom) || undefined,
      createdTo: first(sp.createdTo) || undefined,
      packageVersionId: first(sp.packageVersionId) || undefined,
      priority: first(sp.priority) || undefined,
      bulkPlanRef: first(sp.bulkPlanRef) || undefined,
    },
    sort: PLANNING_SORT_KEYS.includes(sortRaw) ? sortRaw : DEFAULT_PLANNING_SORT,
    page: Math.max(1, Number.parseInt(first(sp.page), 10) || 1),
    pageSize: PLANNING_PAGE_SIZE,
  };
}

type LookupRead = { kind: string; key: string; label_en: string; label_ar: string | null };

type DraftRead = {
  id: string; method: string; plan_reference: string | null; draft_version: number;
  created_at: string; created_by: string; profiles: { full_name: string } | null;
};

const draftRow: Shape<DraftRead> = f => ({
  id: f.text("id"),
  method: f.text("method"),
  plan_reference: f.optionalText("plan_reference"),
  draft_version: f.number("draft_version"),
  created_at: f.text("created_at"),
  created_by: f.text("created_by"),
  profiles: f.toOne("profiles", profile => ({ full_name: profile.text("full_name") })),
});

const distinct = (rows: Record<string, unknown>[], key: string) =>
  [...new Set(rows.map(row => row[key]).filter((value): value is string => typeof value === "string" && value.length > 0))].sort();

function dedupeInspectors(rows: { user_id: string; full_name: string }[]): PlanningInspectorOption[] {
  const byId = new Map<string, string>();
  for (const row of rows) if (!byId.has(row.user_id)) byId.set(row.user_id, row.full_name);
  const nameCount = new Map<string, number>();
  for (const name of byId.values()) nameCount.set(name, (nameCount.get(name) ?? 0) + 1);
  return [...byId.entries()]
    .map(([userId, name]) => ({
      userId,
      label: (nameCount.get(name) ?? 0) > 1 ? `${name} · ${userId.slice(0, 8)}` : name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function loadPlanningWorkspace(
  sb: SupabaseClient,
  params: PlanningListParams,
  viewerId: string | null,
): Promise<PlanningWorkspace> {
  const regionFilter = params.filters.region;
  const [list, lookupsRead, regionsRead, citiesRead, inspectorsRead, draftsRead] = await Promise.all([
    queryPlanningVisits(sb, params),
    sb.from("planning_lookups").select("kind, key, label_en, label_ar").in("kind", ["visit_type", "priority"]).eq("is_active", true).order("sort_order"),
    sb.from("factories").select("region").not("region", "is", null).limit(1000),
    regionFilter
      ? sb.from("factories").select("city").eq("region", regionFilter).not("city", "is", null).limit(1000)
      : sb.from("factories").select("city").not("city", "is", null).limit(1000),
    sb.from("profiles").select("user_id, full_name, user_roles!user_roles_user_id_fkey!inner(role_key)").eq("user_roles.role_key", "inspector").order("full_name"),
    sb.from("visit_plans").select("id, method, status, plan_reference, draft_version, created_at, created_by, profiles!visit_plans_created_by_fkey(full_name)")
      .in("status", ["draft", "validated"]).is("archived_at", null).order("created_at", { ascending: false }).limit(10),
  ]);

  const optionError = lookupsRead.error ?? regionsRead.error ?? citiesRead.error ?? inspectorsRead.error ?? draftsRead.error;
  if (!list.ok || optionError) {
    if (optionError) console.error("[planning.list] option/draft read failed:", optionError.message);
    return { ok: false };
  }

  const rows = list.rows.filter(row => !isTestFixtureEstablishment({ name: row.factoryName }));
  const lastUpdates = await fetchLastUpdates(sb, rows.map(row => row.id));
  const lookups = (lookupsRead.data ?? []) as LookupRead[];
  const toOption = (lookup: LookupRead): PlanningLookupOption =>
    ({ key: lookup.key, labelEn: lookup.label_en, labelAr: lookup.label_ar });
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return {
    ok: true,
    rows,
    lastUpdates,
    counts: list.counts,
    countsAvailable: list.countsAvailable,
    total: list.total,
    page: Math.min(list.page, totalPages),
    totalPages,
    visitTypes: lookups.filter(lookup => lookup.kind === "visit_type").map(toOption),
    priorities: lookups.filter(lookup => lookup.kind === "priority").map(toOption),
    regions: distinct((regionsRead.data ?? []) as Record<string, unknown>[], "region"),
    cities: distinct((citiesRead.data ?? []) as Record<string, unknown>[], "city"),
    inspectors: dedupeInspectors((inspectorsRead.data ?? []) as { user_id: string; full_name: string }[]),
    drafts: readRows(draftsRead, draftRow, "planning.drafts").rows.map(draft => ({
      id: draft.id,
      method: draft.method,
      planReference: draft.plan_reference,
      draftVersion: draft.draft_version,
      createdAt: draft.created_at,
      createdBy: draft.created_by,
      createdByName: draft.profiles?.full_name ?? null,
    })),
    viewerId,
  };
}
