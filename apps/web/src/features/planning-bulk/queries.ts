import { readPages } from "@/lib/postgrest/read";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { getPlanningAccess } from "@/lib/planning/access";
import { loadBulkDraft } from "@/app/(app)/planning/bulk/actions";
import { factoryRow, inspectionRow, violationRow, type FactoryRow } from "./shapes";
import { toCriteriaFactories, type CriteriaFactory } from "./view";

const FACTORY_COLUMNS =
  "id, factory_code, name, cr_number, city, region, risk_band, risk_score, activity_class, official_lat, official_lng, source_synced_at, industrial_licenses!inner(commercial_registration_id,license_type,status,stage,investment_type,investment_size), visits(planning_status, visit_type)";

export type BulkTargeting =
  | { readonly kind: "denied" }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "unavailable" }
  | { readonly kind: "ready"; readonly factories: readonly CriteriaFactory[] };

export async function loadBulkTargeting(): Promise<BulkTargeting> {
  const sb = await supabaseServer();
  const [{ data: { user }, error: authError }, access] = await Promise.all([
    getVerifiedUser(sb),
    getPlanningAccess(sb, ["planning.create.bulk"]),
  ]);
  if (authError || access.error !== null) return { kind: "denied" };
  if (!user) return { kind: "unauthorized" };

  const catalogue = await readPages((from, to) => sb
    .from("factories")
    .select(FACTORY_COLUMNS)
    .not("industrial_licenses.commercial_registration_id", "is", null)
    .eq("is_temporary", false)
    .or("factory_code.like.F-%,source.eq.saqeel_test_data")
    .not("name", "ilike", "CD%")
    .order("risk_score", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to), factoryRow, "planning-bulk.factories");
  if (catalogue.failed) return { kind: "unavailable" };

  const [violations, inspections] = await Promise.all([
    readPages((from, to) => sb
      .from("violations")
      .select("id, inspections!inner(visits!inner(factory_id))")
      .range(from, to), violationRow, "planning-bulk.violations"),
    readPages((from, to) => sb
      .from("inspections")
      .select("id, submitted_at, visits!inner(factory_id), reviews(decision)")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .range(from, to), inspectionRow, "planning-bulk.inspections"),
  ]);
  if (violations.failed || inspections.failed) return { kind: "unavailable" };

  return {
    kind: "ready",
    factories: toCriteriaFactories(catalogue.rows, violations.rows, inspections.rows),
  };
}

export type BulkDraft = NonNullable<Awaited<ReturnType<typeof loadBulkDraft>>["draft"]>;

export type BulkReview =
  | { readonly kind: "denied" }
  | { readonly kind: "unauthorized" }
  | {
    readonly kind: "ready";
    readonly draft: BulkDraft | null;
    readonly draftUnavailable: boolean;
    readonly transitionsExecutable: boolean;
  };

export async function loadBulkReview(planId: string | undefined): Promise<BulkReview> {
  const sb = await supabaseServer();
  const [{ data: { user }, error: authError }, access] = await Promise.all([
    getVerifiedUser(sb),
    getPlanningAccess(sb, ["planning.create.bulk", "planning.submit_for_supervision"]),
  ]);
  if (authError || access.error !== null) return { kind: "denied" };
  if (!user) return { kind: "unauthorized" };

  const resumed = planId === undefined ? null : await loadBulkDraft(planId);
  return {
    kind: "ready",
    draft: resumed?.draft ?? null,
    draftUnavailable: resumed !== null && !resumed.draft,
    transitionsExecutable: access.can("planning.submit_for_supervision"),
  };
}

export type { CriteriaFactory, FactoryRow };
