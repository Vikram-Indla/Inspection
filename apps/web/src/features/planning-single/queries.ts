import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPlanningReadContract,
  planningAuthenticationFailure,
  planningDependencyFailure,
  type PlanningReadFailure,
  type PlanningSingleReadData,
} from "@/lib/planning/read-contract";
import { getPlanningAccess } from "@/lib/planning/access";
import {
  resolveHandoffTarget,
  resolvePlanningTargets,
  type ResolvedPortfolio,
} from "@/lib/planning/factory-resolver";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { findDuplicateActiveVisits, findDuplicateActiveVisitsFor } from "./duplicates";
import { SEARCH_MIN_LENGTH } from "./shapes";
import type { DraftConfig, DraftInfo, GradedFactory, InitialSelection, SinglePlanningData } from "./shapes";

export type SinglePlanningParams = {
  q?: string;
  plan?: string;
  package?: string;
  cr?: string;
  license?: string;
  plant?: string;
  factory?: string;
  source?: string;
};

export type SinglePlanningLoad =
  | { kind: "ready"; data: SinglePlanningData }
  | { kind: "unauthorized" }
  | { kind: "failure"; reason: "contract" | "session"; failure: PlanningReadFailure; retryHref: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SEARCH_LIMIT = 50;
const FACTORY_COLUMNS =
  "id, factory_code, name, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, geofence_radius_m, source, source_synced_at";

type LegacyFactoryRow = {
  id: string; factory_code: string | null; name: string; cr_number: string | null; license_number: string | null;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  official_lat: number | null; official_lng: number | null; geofence_radius_m: number | null;
  source: string | null; source_synced_at: string | null;
};

type LegacyRead = { row: GradedFactory | null; unavailable: boolean };

function gradeCandidate(row: LegacyFactoryRow, q: string): "exact" | "similar_name" | null {
  const ql = q.toLowerCase();
  const identifierExact =
    (row.cr_number != null && row.cr_number === q) ||
    (row.factory_code != null && row.factory_code.toLowerCase() === ql) ||
    (row.license_number != null && row.license_number.toLowerCase() === ql);
  if (identifierExact) return "exact";
  if (row.name.toLowerCase().includes(ql)) return "similar_name";
  return null;
}

function toGradedFactory(
  row: LegacyFactoryRow,
  grade: "exact" | "similar_name",
  duplicates: { id: string; planning_status: string }[],
): GradedFactory {
  return {
    id: row.id,
    factory_code: row.factory_code,
    name: row.name,
    cr_number: row.cr_number,
    license_number: row.license_number,
    region: row.region,
    city: row.city,
    risk_band: row.risk_band,
    risk_score: row.risk_score,
    official_lat: row.official_lat,
    official_lng: row.official_lng,
    geofence_radius_m: row.geofence_radius_m,
    source_synced_at: row.source_synced_at,
    master_source: row.source,
    source: "legacy",
    grade,
    degraded: !row.license_number || row.official_lat == null || row.official_lng == null,
    duplicate: duplicates.length > 0,
    duplicateVisitId: duplicates[0]?.id ?? null,
    duplicateVisitStatus: duplicates[0]?.planning_status ?? null,
  };
}

async function readLegacyFactory(sb: SupabaseClient, id: string): Promise<LegacyRead> {
  const { data, error } = await sb.from("factories").select(FACTORY_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    console.error("[single-planning prefill factory read]", error.message);
    return { row: null, unavailable: true };
  }
  if (!data) return { row: null, unavailable: false };
  const row = data as LegacyFactoryRow;
  const dups = await findDuplicateActiveVisits(sb, row.id);
  if (dups.unavailable) return { row: null, unavailable: true };
  return { row: toGradedFactory(row, "exact", dups.visits), unavailable: false };
}

async function searchLegacyFactories(sb: SupabaseClient, q: string): Promise<{ rows: GradedFactory[]; unavailable: boolean }> {
  const escaped = q.replace(/[%_]/g, character => `\\${character}`);
  const { data, error } = await sb.from("factories").select(FACTORY_COLUMNS)
    .or(`cr_number.eq.${q},factory_code.ilike.%${escaped}%,license_number.ilike.%${escaped}%,name.ilike.%${escaped}%`)
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);
  if (error) {
    console.error("[single-planning search]", error.message);
    return { rows: [], unavailable: true };
  }
  const candidates = (data ?? []) as LegacyFactoryRow[];
  const duplicates = await findDuplicateActiveVisitsFor(sb, candidates.map(row => row.id));
  if (duplicates.unavailable) return { rows: [], unavailable: true };
  return {
    unavailable: false,
    rows: candidates
      .map(row => ({ row, grade: gradeCandidate(row, q), visits: duplicates.byFactory[row.id] ?? [] }))
      .flatMap(entry => entry.grade === null ? [] : [toGradedFactory(entry.row, entry.grade, entry.visits)]),
  };
}

type DraftPayload = {
  target?: {
    factory_id?: string;
    cr_number?: string | null;
    license_number?: string | null;
    canonical_license_number?: string | null;
    plant_number?: string | null;
    source?: string;
  };
  config?: Record<string, string | string[] | null>;
};

const str = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

function draftConfigOf(payload: DraftPayload): DraftConfig {
  const config = payload.config ?? {};
  const savedIds = Array.isArray(config.package_version_ids)
    ? config.package_version_ids.map(String).filter(id => UUID.test(id))
    : undefined;
  const singular = str(config.package_version_id);
  return {
    visitType: str(config.visit_type),
    packageVersionIds: savedIds ?? (singular ? [singular] : undefined),
    executionMode: str(config.execution_mode),
    windowStart: str(config.window_start),
    windowEnd: str(config.window_end),
    inspectorId: str(config.inspector_id),
    notes: str(config.notes),
    licenseNumber: payload.target?.license_number ?? undefined,
  };
}

type Resolution = {
  portfolios: ResolvedPortfolio[];
  graded: GradedFactory[];
  initialSelection: InitialSelection;
  registryUnavailable: boolean;
  prefillMiss: boolean;
};

const EMPTY_RESOLUTION: Resolution = {
  portfolios: [], graded: [], initialSelection: {}, registryUnavailable: false, prefillMiss: false,
};

async function resolveDraftTarget(sb: SupabaseClient, payload: DraftPayload): Promise<Resolution> {
  const target = payload.target;
  if (!target) return EMPTY_RESOLUTION;

  if (target.source === "canonical" && (target.canonical_license_number || target.license_number || target.plant_number)) {
    const hit = await resolveHandoffTarget(sb, {
      cr: target.cr_number ?? undefined,
      license: (target.canonical_license_number ?? target.license_number) ?? undefined,
      plant: target.plant_number ?? undefined,
    });
    if (!hit.ok) {
      console.error("[single-planning draft target resolve failed]");
      return { ...EMPTY_RESOLUTION, registryUnavailable: true };
    }
    if (hit.portfolio) {
      return {
        ...EMPTY_RESOLUTION,
        portfolios: [hit.portfolio],
        initialSelection: hit.licence ? { licenceId: hit.licence.id } : {},
      };
    }
  }

  if (target.factory_id && UUID.test(target.factory_id)) {
    const legacy = await readLegacyFactory(sb, target.factory_id);
    if (legacy.unavailable) return { ...EMPTY_RESOLUTION, registryUnavailable: true };
    if (legacy.row) {
      return { ...EMPTY_RESOLUTION, graded: [legacy.row], initialSelection: { factoryId: legacy.row.id } };
    }
  }

  return { ...EMPTY_RESOLUTION, prefillMiss: true };
}

async function resolveHandoffPrefill(
  sb: SupabaseClient,
  identifiers: { cr: string; license: string; plant: string; factory: string },
): Promise<Resolution> {
  const hit = await resolveHandoffTarget(sb, {
    cr: identifiers.cr || undefined,
    license: identifiers.license || undefined,
    plant: identifiers.plant || undefined,
  });
  if (!hit.ok) {
    console.error("[single-planning handoff resolve failed]");
    return { ...EMPTY_RESOLUTION, registryUnavailable: true };
  }
  if (hit.portfolio) {
    return {
      ...EMPTY_RESOLUTION,
      portfolios: [hit.portfolio],
      initialSelection: hit.licence ? { licenceId: hit.licence.id } : {},
    };
  }
  if (!UUID.test(identifiers.factory)) return { ...EMPTY_RESOLUTION, prefillMiss: true };

  const legacy = await readLegacyFactory(sb, identifiers.factory);
  if (legacy.unavailable) return { ...EMPTY_RESOLUTION, registryUnavailable: true };
  if (!legacy.row) return { ...EMPTY_RESOLUTION, prefillMiss: true };
  return { ...EMPTY_RESOLUTION, graded: [legacy.row], initialSelection: { factoryId: legacy.row.id } };
}

export async function loadSinglePlanning(params: SinglePlanningParams): Promise<SinglePlanningLoad> {
  const sb = await supabaseServer();
  const contract = await getPlanningReadContract<PlanningSingleReadData>(sb, "single");
  if (!contract.ok) {
    if (contract.kind === "denied") return { kind: "unauthorized" };
    return { kind: "failure", reason: "contract", failure: contract, retryHref: "/planning/single" };
  }

  const { data: { user }, error: userError } = await getVerifiedUser(sb);
  if (userError) {
    const failure = planningAuthenticationFailure();
    console.error(`[planning.read:${failure.correlationId}] verified session failed`, userError.message);
    return { kind: "failure", reason: "session", failure, retryHref: "/login?next=/planning/single" };
  }

  const packages = contract.data.packages;
  const inspectors = contract.data.inspectors;
  const transitionAccess = await getPlanningAccess(sb, ["planning.submit_for_supervision"]);
  const transitionsExecutable = transitionAccess.error === null
    && transitionAccess.can("planning.submit_for_supervision");

  const requestedPackageId = (params.package ?? "").trim();
  const packagePrefill = UUID.test(requestedPackageId) && packages.some(pkg => pkg.id === requestedPackageId)
    ? requestedPackageId
    : undefined;

  const planParam = (params.plan ?? "").trim();
  const crParam = (params.cr ?? "").trim();
  const licenseParam = (params.license ?? "").trim();
  const plantParam = (params.plant ?? "").trim();
  const factoryParam = (params.factory ?? "").trim();
  const q = (params.q ?? "").trim();

  let draft: DraftInfo | null = null;
  let draftConfig: DraftConfig = packagePrefill ? { packageVersionIds: [packagePrefill] } : {};
  let sourceChannel = (params.source ?? "").trim() || "planning.single";
  let resolution: Resolution = EMPTY_RESOLUTION;

  if (UUID.test(planParam) && user) {
    const { data: planRow, error: planError } = await sb.from("visit_plans")
      .select("id, plan_reference, status, draft_version, draft_payload, source_channel")
      .eq("id", planParam).eq("created_by", user.id).eq("method", "single")
      .in("status", ["draft", "validated"]).is("archived_at", null)
      .maybeSingle();
    if (planError) {
      console.error("[single-planning draft read]", planError.message);
      return {
        kind: "failure",
        reason: "contract",
        failure: planningDependencyFailure(contract.correlationId),
        retryHref: `/planning/single?plan=${planParam}`,
      };
    }
    if (!planRow) {
      resolution = { ...EMPTY_RESOLUTION, prefillMiss: true };
    } else {
      draft = { id: planRow.id, planReference: planRow.plan_reference, version: planRow.draft_version ?? 0 };
      if (planRow.source_channel) sourceChannel = planRow.source_channel;
      const payload = (planRow.draft_payload ?? {}) as DraftPayload;
      draftConfig = draftConfigOf(payload);
      resolution = await resolveDraftTarget(sb, payload);
    }
  }

  const nothingSelected = !resolution.initialSelection.licenceId
    && !resolution.initialSelection.factoryId
    && !resolution.prefillMiss;
  const handoff = nothingSelected && (crParam !== "" || licenseParam !== "" || plantParam !== "" || UUID.test(factoryParam));

  if (nothingSelected && (crParam || licenseParam || plantParam)) {
    resolution = await resolveHandoffPrefill(sb, {
      cr: crParam, license: licenseParam, plant: plantParam, factory: factoryParam,
    });
  } else if (nothingSelected && resolution.portfolios.length === 0 && UUID.test(factoryParam)) {
    const legacy = await readLegacyFactory(sb, factoryParam);
    resolution = legacy.unavailable
      ? { ...EMPTY_RESOLUTION, registryUnavailable: true }
      : legacy.row
        ? { ...EMPTY_RESOLUTION, graded: [legacy.row], initialSelection: { factoryId: legacy.row.id } }
        : { ...EMPTY_RESOLUTION, prefillMiss: true };
  }

  if (q.length >= SEARCH_MIN_LENGTH) {
    const canonical = await resolvePlanningTargets(sb, { q });
    if (!canonical.ok) {
      resolution = { ...resolution, registryUnavailable: true };
    } else if (canonical.portfolios.length > 0) {
      resolution = { ...resolution, portfolios: canonical.portfolios, graded: [] };
    } else {
      const legacy = await searchLegacyFactories(sb, q);
      resolution = {
        ...resolution,
        portfolios: [],
        graded: legacy.rows,
        registryUnavailable: resolution.registryUnavailable || legacy.unavailable,
      };
    }
  }

  const handoffPackage = sourceChannel === "admin.packages" && packagePrefill
    ? packages.find(pkg => pkg.id === packagePrefill) ?? null
    : null;

  return {
    kind: "ready",
    data: {
      query: q,
      portfolios: resolution.portfolios,
      results: resolution.graded,
      registryUnavailable: resolution.registryUnavailable,
      initialSelection: resolution.initialSelection,
      draft,
      draftConfig,
      sourceChannel,
      handoff,
      adminPackageHandoff: handoffPackage
        ? `${handoffPackage.packages.code} · ${handoffPackage.version_label}`
        : null,
      prefillMiss: resolution.prefillMiss,
      packages,
      inspectors,
      virtualEligible: contract.data.virtual_eligible,
      transitionsExecutable,
    },
  };
}
