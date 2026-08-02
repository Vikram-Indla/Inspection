import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import { getPlanningAccess } from "@/lib/planning/access";
import type { BulkFormStrings } from "./BulkForm";
import type { CriteriaBuilderStrings, BuilderField } from "./CriteriaBuilder";
import type { LedgerStrings } from "./EligibilityLedger";
import type { Bucket, Distribution, DistributionStrings } from "./DistributionPanels";
import TargetingLensClient from "./TargetingLensClient";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import WidgetBoundary from "@/components/WidgetBoundary";
import { parseCt, fromFlat, evalNode, hasCriteria, emptyTree, leaves, pathKey, FIELD_REGISTRY, type Op } from "./criteria";

type FactoryForCriteria = {
  region: string | null; risk_band: string | null; activity_class: string | null; city: string | null;
  industrial_licenses?: Array<{
    license_type: string | null; status: string | null; stage: string | null;
    investment_type: string | null; investment_size: number | null;
  }> | null;
};

const toArr = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<{ ct?: string; cf?: string | string[]; co?: string | string[]; cv?: string | string[]; combine?: string }> }) {
  const sp = await searchParams;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();

  // RBAC-007 / M6 — capability-gated entry (planning.create.bulk), resolved via
  // the canonical planning access model (same pattern as /planning/immediate).
  // Planner and Supervisor hold the capability; Inspector/Admin do not. Fail
  // closed: a resolution error is a denial, never a permissive default. RLS
  // remains the data boundary and the governed submission RPC re-checks role.
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  const access = await getPlanningAccess(sb, ["planning.create.bulk"]);
  if (authError || access.error !== null) {
    console.error("[ bulk planning authorization]", authError?.message ?? access.error);
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <div className="sq-banner sq-banner--critical" role="alert">{t("plan.bulk.unavailable", "Planning data is not available right now. Nothing was changed. Try again once access is fixed.")}</div>
      </Shell>
    );
  }
  if (!user || !access.can("planning.create.bulk")) {
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <EmptyState glyph="⛔" title={tr("plan.bulk.unauthorized.title", "You don't have permission", "ليست لديك الصلاحية اللازمة")}
          body={tr("plan.bulk.unauthorized.body", "Plan multiple visits needs Planner or Supervisor access.", "يتطلب تخطيط زيارات متعددة صلاحية المخطط أو المشرف.")} />
      </Shell>
    );
  }

  // M01-003/012/022 — criteria tree. New `ct` param (nested ALL/ANY) is
  // authoritative; legacy cf/co/cv links still parse for backward compatibility.
  // A NON-EMPTY `ct` that fails to parse is a distinct, honest state from "no
  // criteria at all" (ERR-PLN-001): we do not silently fall through to
  // match-everything without telling the planner their criteria were dropped.
  const ctParsed = parseCt(sp.ct);
  const ctWasInvalid = Boolean(sp.ct) && ctParsed === null;
  const tree = ctParsed
    ?? fromFlat(toArr(sp.cf), toArr(sp.co), toArr(sp.cv), sp.combine ?? "and")
    ?? emptyTree();
  const criteriaApplied = hasCriteria(tree);

  // M01-004 — all factories fetched, then the tree evaluated server-side
  // (ALL = every child / ANY = some, nested). No DB-level .eq filters: is-not
  // and ANY combinations aren't simple equality, so evaluation is uniform here.
  const { data: allFactories, error: factoriesError } = await collectPostgrestPages<FactoryForCriteria & Record<string, unknown>>((from, to) => sb
    .from("factories")
    .select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, activity_class, official_lat, official_lng, source_synced_at, industrial_licenses(license_type,status,stage,investment_type,investment_size), visits(planning_status, visit_type)")
    .eq("is_temporary", false)
    // Include the one explicitly labelled Saqeel test target in the exact
    // same criteria journey as sourced factory records.
    .or("factory_code.like.F-%,source.eq.saqeel_test_data")
    .not("name", "ilike", "CD%")
    .order("risk_score", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryForCriteria & Record<string, unknown>>>);
  // A failed authorized read must never masquerade as a legitimate empty
  // catalog (0 in scope, 0 eligible). One shared query backs every panel on
  // this screen, so isolation here is page-level, not per-widget; the wiring
  // map previously claimed per-source isolation this architecture can't do.
  if (factoriesError) {
    console.error("[] factories read failed:", factoriesError.message, factoriesError.code);
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <EmptyState glyph="⚠" title={t("plan.bulk.serviceUnavailable.title", "Factory list not available")}
          body={t("plan.bulk.serviceUnavailable.body", "We couldn't load the Factory list. Nothing was filtered or published. Try again once access is fixed.")} />
      </Shell>
    );
  }

  // M6 — computed criteria sources: violation counts (violations → inspections
  // → visits → factory) and the latest inspection date / review outcome per
  // factory. These are COMPLETE reads aggregated in memory: a factory absent
  // from violations genuinely has 0 recorded violations (a real zero, not a
  // fabricated default); a factory with no review has NO outcome (absence,
  // matches nothing). A failed read fails the page like the factory catalog —
  // partial history would silently mis-evaluate numeric/date criteria.
  const [violationsRead, inspectionsRead] = await Promise.all([
    collectPostgrestPages<Record<string, unknown>>((from, to) => sb
      .from("violations")
      .select("id, inspections!inner(visits!inner(factory_id))")
      .range(from, to) as unknown as PromiseLike<PostgrestPage<Record<string, unknown>>>),
    collectPostgrestPages<Record<string, unknown>>((from, to) => sb
      .from("inspections")
      .select("id, submitted_at, visits!inner(factory_id), reviews(decision)")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .range(from, to) as unknown as PromiseLike<PostgrestPage<Record<string, unknown>>>),
  ]);
  if (violationsRead.error || inspectionsRead.error) {
    console.error("[] criteria history read failed:", violationsRead.error?.message ?? inspectionsRead.error?.message);
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <EmptyState glyph="⚠" title={t("plan.bulk.serviceUnavailable.title", "Factory list not available")}
          body={t("plan.bulk.serviceUnavailable.body", "We couldn't load the Factory list. Nothing was filtered or published. Try again once access is fixed.")} />
      </Shell>
    );
  }
  const violationCountByFactory = new Map<string, number>();
  for (const row of violationsRead.data ?? []) {
    const fid = (row as { inspections?: { visits?: { factory_id?: string } } }).inspections?.visits?.factory_id;
    if (fid) violationCountByFactory.set(fid, (violationCountByFactory.get(fid) ?? 0) + 1);
  }
  // inspections arrive newest-first → the first row seen per factory carries
  // its latest submitted date and (when present) its latest review decision.
  const lastInspectionByFactory = new Map<string, { date: string | null; outcome: string | null }>();
  for (const row of inspectionsRead.data ?? []) {
    const r = row as { submitted_at: string | null; visits?: { factory_id?: string }; reviews?: { decision: string | null }[] };
    const fid = r.visits?.factory_id;
    if (!fid || lastInspectionByFactory.has(fid)) continue;
    const decision = (r.reviews ?? []).map(x => x.decision).find((d): d is string => typeof d === "string" && d.trim() !== "") ?? null;
    lastInspectionByFactory.set(fid, { date: r.submitted_at, outcome: decision });
  }

  const everyFactory = ((allFactories ?? []) as unknown as (FactoryForCriteria & Record<string, unknown>)[]).map(f => {
    const licence = f.industrial_licenses?.[0] ?? null;
    return {
      ...f,
      license_type: licence?.license_type ?? null,
      license_status: licence?.status ?? null,
      plant_state: licence?.stage ?? null,
      investment_type: licence?.investment_type ?? null,
      investment_size: licence?.investment_size ?? null,
      previous_violation_count: violationCountByFactory.get(String(f.id)) ?? 0,
      previous_outcome: lastInspectionByFactory.get(String(f.id))?.outcome ?? null,
      last_inspection_date: lastInspectionByFactory.get(String(f.id))?.date ?? null,
    };
  });
  // M6 — at least one criterion is required (no match-all). An empty/absent
  // criteria tree yields NO results with an honest banner; the builder still
  // renders so the planner can compose criteria. The unrestricted-match
  // capability gap is recorded in PLANNING_IMPLEMENTATION_NOTES (M6).
  const factories = criteriaApplied
    ? everyFactory.filter(f => evalNode(f as Record<string, unknown>, tree))
    : [];
  // Distinct value lists per field (datalist suggestions in the builder).
  const distinct = (key: string) => [...new Set(everyFactory.map(f => (f as Record<string, unknown>)[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();
  const fieldOptions: Record<string, string[]> = {
    region: distinct("region"), risk_band: distinct("risk_band"),
    activity_class: distinct("activity_class"), city: distinct("city"),
    license_type: distinct("license_type"), license_status: distinct("license_status"),
    plant_state: distinct("plant_state"), investment_type: distinct("investment_type"),
    previous_outcome: distinct("previous_outcome"),
  };
  // Region → cities map for the dependent city dropdown (a city suggestion
  // list follows the chosen region instead of offering impossible pairings).
  const cityByRegion: Record<string, string[]> = {};
  for (const f of everyFactory) {
    const region = typeof f.region === "string" && f.region.trim() ? f.region : null;
    const city = typeof f.city === "string" && f.city.trim() ? f.city : null;
    if (!region || !city) continue;
    cityByRegion[region] = cityByRegion[region] ?? [];
    if (!cityByRegion[region].includes(city)) cityByRegion[region].push(city);
  }
  for (const r of Object.keys(cityByRegion)) cityByRegion[r].sort();

  // CD-021 — server-side aggregates over the EVALUATED (matched) set only.
  // Pure counts; null/blank values fall into an explicit "unknown" bucket and
  // are never dropped. denominator = whole scope; eligible = matched.
  const denominator = everyFactory.length;
  const buildDistribution = (key: string, heading: string): Distribution => {
    const counts = new Map<string, number>();
    let unknown = 0;
    for (const f of factories) {
      const v = (f as Record<string, unknown>)[key];
      if (typeof v === "string" && v.trim() !== "") counts.set(v, (counts.get(v) ?? 0) + 1);
      else unknown += 1;
    }
    const buckets: Bucket[] = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    if (unknown > 0) buckets.push({ label: "unknown", count: unknown, unknown: true });
    return { key, heading, total: factories.length, buckets };
  };
  const distributions: Distribution[] = [
    buildDistribution("region", t("plan.bulk.dist.region", "By region")),
    buildDistribution("risk_band", t("plan.bulk.dist.risk", "By risk band (recorded)")),
    buildDistribution("activity_class", t("plan.bulk.dist.activity", "By activity class")),
  ];
  const riskCounts = everyFactory.reduce<Record<string, number>>((acc, f) => {
    const band = typeof f.risk_band === "string" && f.risk_band.trim() ? f.risk_band : "unknown";
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, {});
  const regionCounts = everyFactory.reduce<Record<string, number>>((acc, f) => {
    const region = typeof f.region === "string" && f.region.trim() ? f.region : "unknown";
    acc[region] = (acc[region] ?? 0) + 1;
    return acc;
  }, {});
  // Freshness — real FND-013 factories.source_synced_at over the matched set.
  // We report the oldest sync time and how many rows lack it; we do NOT label
  // "stale" (no governed staleness threshold exists — inventing one is barred).
  const syncTimes = factories.map(f => (f as Record<string, unknown>).source_synced_at).filter((v): v is string => typeof v === "string");
  const oldestSyncedAt = syncTimes.length ? syncTimes.reduce((a, b) => (a < b ? a : b)) : null;
  const missingSync = factories.length - syncTimes.length;
  const aiPlanningContext = JSON.stringify({
    scope: { factories: denominator, eligible: factories.length, criteria_applied: criteriaApplied },
    risk_band_counts: riskCounts,
    region_counts: regionCounts,
    oldest_source_sync: oldestSyncedAt,
    missing_source_sync: missingSync,
    rule: "Use only these recorded aggregates. Do not select factories, alter risk values, invent thresholds, or publish a plan.",
  });

  // "Focus condition" (design frame 1a) — each leaf's population contribution,
  // computed alone against the whole scope (independent of its siblings), so
  // focusing a chip reveals what THAT condition alone would keep. Client-only
  // interaction (no new server action); paths key against the tree as-applied.
  const leafList = leaves(tree);
  const contributions: Record<string, number> = {};
  for (const leaf of leafList) {
    contributions[pathKey(leaf.path)] = everyFactory.filter(f => evalNode(f as Record<string, unknown>, leaf.node)).length;
  }
  const leafInfo = leafList.map(l => ({ pathKey: pathKey(l.path), field: l.node.field, value: l.node.value }));

  // M6 — the criteria dictionary resolved for the builder: supplied fields with
  // their per-type operators, then CONTRACT_NOT_SUPPLIED fields (disabled,
  // with the honest explanation — never silently absent, never evaluated).
  const fieldLabels: Record<string, string> = {
    region: t("plan.bulk.criteria.fieldRegion", "Region"),
    city: t("plan.bulk.criteria.fieldCity", "City"),
    risk_band: t("plan.bulk.criteria.fieldRiskBand", "Risk band"),
    activity_class: t("plan.bulk.criteria.fieldActivity", "ISIC activity"),
    license_type: t("plan.bulk.criteria.fieldLicenseType", "Licence tier / type"),
    license_status: t("plan.bulk.criteria.fieldLicenseStatus", "Licence status"),
    plant_state: t("plan.bulk.criteria.fieldPlantState", "Plant state"),
    investment_type: t("plan.bulk.criteria.fieldInvestmentType", "Investment type"),
    investment_size: t("plan.bulk.criteria.fieldInvestmentSize", "Investment size"),
    previous_violation_count: t("plan.bulk.criteria.fieldViolationCount", "Previous violation count"),
    previous_outcome: t("plan.bulk.criteria.fieldOutcome", "Previous inspection outcome"),
    last_inspection_date: t("plan.bulk.criteria.fieldLastInspection", "Last inspection date"),
    sector: t("plan.bulk.criteria.fieldSector", "Sector"),
    product_hs_code: t("plan.bulk.criteria.fieldProductHs", "Product / HS code"),
    land_provider: t("plan.bulk.criteria.fieldLandProvider", "Land provider"),
    employee_count: t("plan.bulk.criteria.fieldEmployeeCount", "Employee count"),
    issuing_authority: t("plan.bulk.criteria.fieldIssuingAuthority", "Issuing authority"),
  };
  const opLabels: Record<Op, string> = {
    eq: t("plan.bulk.criteria.opIs", "is"),
    neq: t("plan.bulk.criteria.opIsNot", "is not"),
    contains: t("plan.bulk.criteria.opContains", "contains"),
    in: t("plan.bulk.criteria.opIn", "is one of"),
    gt: t("plan.bulk.criteria.opGt", "greater than"),
    lt: t("plan.bulk.criteria.opLt", "less than"),
    between: t("plan.bulk.criteria.opBetween", "between"),
  };
  const notSuppliedReasons: Record<string, string> = {
    "plan.bulk.criteria.nsSector": t("plan.bulk.criteria.nsSector", "There is no sector data set up yet — this can't be checked, and is never treated as blank."),
    "plan.bulk.criteria.nsLicenseStage": t("plan.bulk.criteria.nsLicenseStage", "Licence stage is filled in for only about 1% of the licence list — too little to target by."),
    "plan.bulk.criteria.nsLicenseStatus": t("plan.bulk.criteria.nsLicenseStatus", "Licence status is filled in for only about 1% of the licence list — too little to target by."),
    "plan.bulk.criteria.nsProductHs": t("plan.bulk.criteria.nsProductHs", "Product / HS codes exist for only 4 factories — not enough to target by yet."),
    "plan.bulk.criteria.nsLandProvider": t("plan.bulk.criteria.nsLandProvider", "There is no land-provider field in the factory data."),
    "plan.bulk.criteria.nsEmployeeCount": t("plan.bulk.criteria.nsEmployeeCount", "Employee count is recorded for only 4 of 1,339 factories — far too few to target by."),
    "plan.bulk.criteria.nsIssuingAuthority": t("plan.bulk.criteria.nsIssuingAuthority", "Issuing authority is not filled in yet, so it can't be used to target by."),
  };
  const builderFields: BuilderField[] = FIELD_REGISTRY.map(def => ({
    key: def.key,
    label: fieldLabels[def.key] ?? def.key,
    type: def.type,
    operators: def.operators.map(op => ({ op, label: opLabels[op] })),
    supplied: def.supplied,
    reason: def.notSuppliedKey ? notSuppliedReasons[def.notSuppliedKey] : undefined,
  }));

  const ledgerStrings: LedgerStrings = {
    heading: t("plan.bulk.ledger.heading", "Eligibility ledger"),
    denominator: t("plan.bulk.ledger.denominator", "In scope"),
    eligible: t("plan.bulk.ledger.eligible", "Eligible (match criteria)"),
    excluded: t("plan.bulk.ledger.excluded", "Excluded by criteria"),
    freshness: t("plan.bulk.ledger.freshness", "Oldest Factory list sync"),
    freshnessNever: t("plan.bulk.ledger.freshnessNever", "no sync timestamp"),
    freshnessMissing: t("plan.bulk.ledger.freshnessMissing", "{n} missing sync"),
    focusContribution: t("plan.bulk.ledger.focus", "{n} from focused condition"),
  };
  const distStrings: DistributionStrings = {
    heading: t("plan.bulk.dist.heading", "Distribution of eligible factories"),
    ofDenominator: t("plan.bulk.dist.of", "of {n}"),
    unknown: t("plan.bulk.dist.unknown", "unknown"),
    riskAdvisory: t("plan.bulk.dist.riskAdvisory", "Risk band is recorded and advisory only — nothing is auto-selected."),
  };
  const strings: BulkFormStrings = {
    colFactory: t("plan.bulk.colFactory", "Factory"),
    colCr: t("plan.bulk.colCr", "CR"),
    colCity: t("plan.bulk.colCity", "City"),
    colRisk: t("plan.bulk.colRisk", "Risk"),
    colEligibility: t("plan.bulk.colEligibility", "Eligibility"),
    colProvenance: t("plan.bulk.colProvenance", "Source / synced"),
    colDataQuality: t("plan.bulk.colDataQuality", "Data quality"),
    selectFactory: t("plan.bulk.selectFactory", "select {name}"),
    eligible: t("plan.bulk.eligible", "eligible"),
    duplicate: t("plan.bulk.duplicate", "duplicate — active visit"),
    riskAdvisory: t("plan.bulk.riskAdvisory", "Risk band is recorded and advisory — nothing is auto-selected."),
    filterLabel: t("plan.bulk.filterLabel", "Filter within results"),
    filterPlaceholder: t("plan.bulk.filterPlaceholder", "Name, code, CR, city or region…"),
    resultsCount: t("plan.bulk.resultsCount", "{n} results"),
    selectVisible: t("plan.bulk.selectVisible", "Select this page"),
    selectAllResults: t("plan.bulk.selectAllResults", "Select all results"),
    clearSelection: t("plan.bulk.clearSelection", "Clear selection"),
    pagePrev: t("plan.bulk.pagePrev", "Previous"),
    pageNext: t("plan.bulk.pageNext", "Next"),
    pageStatus: t("plan.bulk.pageStatus", "{a}–{b} of {n}"),
    provSynced: t("plan.bulk.provSynced", "synced {d}"),
    provNoSync: t("plan.bulk.provNoSync", "no sync record"),
    dqComplete: t("plan.bulk.dqComplete", "complete"),
    dqNoLocation: t("plan.bulk.dqNoLocation", "no location — dispatch blocked"),
    dqUnknownRisk: t("plan.bulk.dqUnknownRisk", "unknown risk"),
    selectionBar: t("plan.bulk.selectionBar", "{n} selected"),
    readyNothing: t("plan.bulk.readyNothing", "select at least one factory"),
    reviewContinue: t("plan.bulk.reviewContinue", "Review & continue"),
    invalidTitle: t("plan.bulk.invalidTitle", "Selection changed"),
    invalidBody: t("plan.bulk.invalidBody", "{n} previously selected factories no longer match the current criteria and were removed from your selection."),
    invalidKeep: t("plan.bulk.invalidKeep", "Keep remaining selection"),
    invalidClear: t("plan.bulk.invalidClear", "Clear all"),
    summaryTitle: t("plan.bulk.summaryTitle", "Campaign summary — deterministic"),
    summarySelected: t("plan.bulk.summarySelected", "Selected factories"),
    summaryByBand: t("plan.bulk.summaryByBand", "By risk band"),
    summaryByRegion: t("plan.bulk.summaryByRegion", "By region"),
    summaryEmpty: t("plan.bulk.summaryEmpty", "Select factories to build the campaign summary."),
    riskBands: { high: t("enum.high", "high"), medium: t("enum.medium", "medium"), low: t("enum.low", "low") },
    selectAllConfirmTitle: t("plan.bulk.selectAllConfirmTitle", "Confirm select all results"),
    selectAllConfirmBody: t("plan.bulk.selectAllConfirmBody", "This selects all {n} results matching the current criteria, across every page — not just what's visible. Type {n} to confirm."),
    selectAllConfirmInputLabel: t("plan.bulk.selectAllConfirmInputLabel", "Type the count to confirm"),
    selectAllConfirmButton: t("plan.bulk.selectAllConfirmButton", "Select all {n}"),
    selectAllConfirmCancel: t("plan.bulk.selectAllConfirmCancel", "Cancel"),
    saveDraft: t("plan.bulk.saveDraft", "Save draft"),
    savingDraft: t("plan.bulk.savingDraft", "Saving draft…"),
    draftSaved: t("plan.bulk.draftSaved", "Draft saved · {ref}"),
    draftSaveFailed: t("plan.bulk.draftSaveFailed", "Selection ready in this browser — continue to Review."),
    reviewFallback: t("plan.bulk.reviewFallback", "Continue to review without saving"),
  };
  const criteriaStrings: CriteriaBuilderStrings = {
    heading: t("plan.bulk.criteria.heading", "Targeting criteria"),
    combineLabel: t("plan.bulk.criteria.combineLabel", "Match"),
    combineAll: t("plan.bulk.criteria.combineAll", "ALL of — every child must match"),
    combineAny: t("plan.bulk.criteria.combineAny", "ANY of — at least one child matches"),
    fieldLabel: t("plan.bulk.criteria.fieldLabel", "Field"),
    opLabel: t("plan.bulk.criteria.opLabel", "Operator"),
    valueLabel: t("plan.bulk.criteria.valueLabel", "Value"),
    valuePlaceholder: t("plan.bulk.criteria.valuePlaceholder", "Type or pick a value"),
    valueToLabel: t("plan.bulk.criteria.valueToLabel", "and"),
    inHint: t("plan.bulk.criteria.inHint", "Separate values with commas."),
    notSuppliedTag: t("plan.bulk.criteria.notSuppliedTag", "Not available"),
    addCondition: t("plan.bulk.criteria.addCondition", "Add condition"),
    addGroup: t("plan.bulk.criteria.addGroup", "Add nested group"),
    remove: t("plan.bulk.criteria.remove", "Remove"),
    removeGroup: t("plan.bulk.criteria.removeGroup", "Remove group"),
    moveUp: t("plan.bulk.criteria.moveUp", "Move up"),
    moveDown: t("plan.bulk.criteria.moveDown", "Move down"),
    apply: t("plan.bulk.criteria.apply", "Apply criteria"),
    clear: t("plan.bulk.criteria.clear", "Clear all"),
    matching: t("plan.bulk.matching", "{n} matching factories"),
    hint: t("plan.bulk.criteria.hint", "Criteria are evaluated server-side over every factory in your scope — nested ALL/ANY groups and is-not included."),
    groupItem: t("plan.bulk.criteria.groupItem", "criteria group"),
    conditionItem: t("plan.bulk.criteria.conditionItem", "condition"),
    invalidTitle: t("plan.bulk.criteria.invalidTitle", "Incomplete condition"),
    invalidBody: t("plan.bulk.criteria.invalidBody", "{n} condition(s) are missing a value. An incomplete condition is dropped rather than applied — fill it in or remove it before applying."),
    contributionLabel: t("plan.bulk.criteria.contributionLabel", "{n} match this condition alone — focus"),
    unfocusLabel: t("plan.bulk.criteria.unfocusLabel", "Clear focus"),
  };
  return (
    <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}
      context={<span className="sq-lozenge sq-lozenge--info">{t("plan.bulk.context", "AND/OR criteria builder")}</span>}>
      {ctWasInvalid && (
        <div className="sq-banner sq-banner--warning" role="alert" aria-label={t("plan.bulk.invalidCt.title", "Criteria could not be read")}>
          <strong>{t("plan.bulk.invalidCt.title", "Criteria could not be read")}</strong>
          <p>{t("plan.bulk.invalidCt.body", "The criteria link was invalid or corrupted (ERR-) and could not be applied. No results are shown until valid criteria are applied — please rebuild your criteria below.")}</p>
        </div>
      )}
      {!criteriaApplied && !ctWasInvalid && (
        <div className="sq-banner sq-banner--warning" role="alert" aria-label={tr("plan.bulk.noCriteria.title", "At least one criterion is required", "يلزم معيار واحد على الأقل")}>
          <strong>{tr("plan.bulk.noCriteria.title", "At least one criterion is required", "يلزم معيار واحد على الأقل")}</strong>
          <p>{tr("plan.bulk.noCriteria.body", "Bulk targeting never matches the whole Factory list by default. Add at least one criterion below to see matching factories. Nothing is selected or sent without a clear scope.", "لا يطابق الاستهداف الجماعي كل قائمة المصانع تلقائيًا. أضف معيارًا واحدًا على الأقل أدناه لعرض المصانع المطابقة. لا يتم اختيار أو إرسال أي شيء دون نطاق واضح.")}</p>
        </div>
      )}
      {/* MVP1-M01-016 / MVP1-M01-026 · AC-0016 / AC-0026 — contextual planning summary.
          M10 / canonical §19 — fails isolated, never blanks the targeting UI. */}
      <WidgetBoundary label={t("plan.bulk.ai.unavailable", "AI is not available right now — nothing was generated or changed.")}>
        <ContextualAiPanel
          surface="planning_summary"
          title={t("plan.bulk.ai.title", "AI planning summary")}
          description={t("plan.bulk.ai.description", "Evidence-linked advisory summary of the current factory scope. It never selects, ranks or publishes anything.")}
          context={aiPlanningContext}
          evidenceRefs={["AC-0016", "AC-0026", "M01-016", "M01-026", "SCR-WEB-110"]}
          generateLabel={t("plan.bulk.ai.generate", "Generate planning summary")}
          unavailableLabel={t("plan.bulk.ai.unavailable", "AI is not available right now — nothing was generated or changed.")}
          evidenceLabel={t("plan.bulk.ai.evidence", "Source evidence")}
          advisoryLabel={t("plan.bulk.ai.advisory", "Advisory only · human decides")}
        />
      </WidgetBoundary>
      <TargetingLensClient
        initialTree={tree} fieldOptions={fieldOptions} matchCount={factories.length} criteriaStrings={criteriaStrings}
        contributions={contributions} leafInfo={leafInfo}
        denominator={denominator} eligible={factories.length} oldestSyncedAt={oldestSyncedAt} missingSync={missingSync} ledgerStrings={ledgerStrings}
        distributions={distributions} distStrings={distStrings}
        factories={factories as never} bulkFormStrings={strings} locale={locale === "ar" ? "ar" : "en"}
        builderFields={builderFields} cityByRegion={cityByRegion}
      />
    </Shell>
  );
}
