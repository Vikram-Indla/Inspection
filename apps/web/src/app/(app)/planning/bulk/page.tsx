import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { collectPostgrestPages, type PostgrestPage } from "@/lib/supabase-pagination";
import type { BulkFormStrings } from "./BulkForm";
import type { CriteriaBuilderStrings } from "./CriteriaBuilder";
import type { LedgerStrings } from "./EligibilityLedger";
import type { Bucket, Distribution, DistributionStrings } from "./DistributionPanels";
import TargetingLensClient from "./TargetingLensClient";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import { parseCt, fromFlat, evalNode, hasCriteria, emptyTree, leaves, pathKey } from "./criteria";

type FactoryForCriteria = {
  region: string | null; risk_band: string | null; activity_class: string | null; city: string | null;
};

const toArr = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<{ ct?: string; cf?: string | string[]; co?: string | string[]; cv?: string | string[]; combine?: string }> }) {
  const sp = await searchParams;
  const { t, locale } = await useT();
  const sb = await supabaseServer();

  // RBAC-007 — Visit Planning (bulk targeting + its P02 review step) is a
  // Planner-only capability. RLS already blocks the eventual publish write for
  // any other role, but the read-only targeting UI must not render for them
  // either (a non-planner authenticated user previously saw the full screen).
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  const { data: myRoles, error: rolesError } = user
    ? await getUserRoles(user.id)
    : { data: [] as { role_key: string }[], error: null };
  if (authError || rolesError) {
    console.error("[CD-021 bulk planning authorization]", authError?.message ?? rolesError?.message);
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <div className="ax-banner ax-banner--critical" role="alert">{t("plan.bulk.unavailable", "Planning data is temporarily unavailable (ERR-OPS-001). Try again.")}</div>
      </Shell>
    );
  }
  const isPlanner = (myRoles ?? []).some(r => r.role_key === "planner");
  if (!isPlanner) {
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <EmptyState glyph="⛔" title={t("plan.bulk.unauthorized.title", "Authorized role required")}
          body={t("plan.bulk.unauthorized.body", "Plan multiple visits (SCR-WEB-110) is available to the Planner role only.")} />
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
  // M01-004 — all factories fetched, then the tree evaluated server-side
  // (ALL = every child / ANY = some, nested). No DB-level .eq filters: is-not
  // and ANY combinations aren't simple equality, so evaluation is uniform here.
  const { data: allFactories, error: factoriesError } = await collectPostgrestPages<FactoryForCriteria & Record<string, unknown>>((from, to) => sb
    .from("factories")
    .select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, activity_class, official_lat, official_lng, source_synced_at, visits(planning_status, visit_type)")
    .order("risk_score", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to) as unknown as PromiseLike<PostgrestPage<FactoryForCriteria & Record<string, unknown>>>);
  // ERR-OPS-001 — a failed read must never masquerade as a legitimate empty
  // catalog (0 in scope, 0 eligible). One shared query backs every panel on
  // this screen, so isolation here is page-level, not per-widget; the wiring
  // map previously claimed per-source isolation this architecture can't do.
  if (factoriesError) {
    console.error("[CD-021] factories read failed:", factoriesError.message, factoriesError.code);
    return (
      <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}>
        <EmptyState glyph="⚠" title={t("plan.bulk.serviceUnavailable.title", "Factory list unavailable")}
          body={t("plan.bulk.serviceUnavailable.body", "The Factory list could not be read (ERR-OPS-001). Nothing was filtered or published. Please retry.")} />
      </Shell>
    );
  }
  const everyFactory = (allFactories ?? []) as unknown as (FactoryForCriteria & Record<string, unknown>)[];
  const factories = hasCriteria(tree)
    ? everyFactory.filter(f => evalNode(f as Record<string, unknown>, tree))
    : everyFactory;
  // Distinct value lists per field (datalist suggestions in the builder).
  const distinct = (key: string) => [...new Set(everyFactory.map(f => (f as Record<string, unknown>)[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();
  const fieldOptions: Record<string, string[]> = {
    region: distinct("region"), risk_band: distinct("risk_band"),
    activity_class: distinct("activity_class"), city: distinct("city"),
  };

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
    scope: { factories: denominator, eligible: factories.length, criteria_applied: hasCriteria(tree) },
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
    riskAdvisory: t("plan.bulk.dist.riskAdvisory", "Risk band is recorded (ENG-04) and advisory only — nothing is auto-selected."),
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
    duplicate: t("plan.bulk.duplicate", "duplicate — active visit (M02-012)"),
    riskAdvisory: t("plan.bulk.riskAdvisory", "Risk band is recorded (ENG-04) and advisory — nothing is auto-selected."),
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
    summaryTitle: t("plan.bulk.summaryTitle", "Campaign summary — deterministic (M01-016/026)"),
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
  };
  const criteriaStrings: CriteriaBuilderStrings = {
    heading: t("plan.bulk.criteria.heading", "Targeting criteria (M01-003/012/022)"),
    combineLabel: t("plan.bulk.criteria.combineLabel", "Match"),
    combineAll: t("plan.bulk.criteria.combineAll", "ALL of — every child must match"),
    combineAny: t("plan.bulk.criteria.combineAny", "ANY of — at least one child matches"),
    fieldLabel: t("plan.bulk.criteria.fieldLabel", "Field"),
    opLabel: t("plan.bulk.criteria.opLabel", "Operator"),
    valueLabel: t("plan.bulk.criteria.valueLabel", "Value"),
    valuePlaceholder: t("plan.bulk.criteria.valuePlaceholder", "Type or pick a value"),
    fieldRegion: t("plan.bulk.criteria.fieldRegion", "Region"),
    fieldRiskBand: t("plan.bulk.criteria.fieldRiskBand", "Risk band"),
    fieldActivity: t("plan.bulk.criteria.fieldActivity", "Activity class"),
    fieldCity: t("plan.bulk.criteria.fieldCity", "City"),
    opIs: t("plan.bulk.criteria.opIs", "is"),
    opIsNot: t("plan.bulk.criteria.opIsNot", "is not"),
    addCondition: t("plan.bulk.criteria.addCondition", "Add condition"),
    addGroup: t("plan.bulk.criteria.addGroup", "Add nested group"),
    remove: t("plan.bulk.criteria.remove", "Remove"),
    removeGroup: t("plan.bulk.criteria.removeGroup", "Remove group"),
    moveUp: t("plan.bulk.criteria.moveUp", "Move up"),
    moveDown: t("plan.bulk.criteria.moveDown", "Move down"),
    apply: t("plan.bulk.criteria.apply", "Apply criteria"),
    clear: t("plan.bulk.criteria.clear", "Clear all"),
    matching: t("plan.bulk.matching", "{n} matching factories (M01-004: all matching returned)"),
    hint: t("plan.bulk.criteria.hint", "Criteria are evaluated server-side over every factory in your scope — nested ALL/ANY groups and is-not included."),
    groupItem: t("plan.bulk.criteria.groupItem", "criteria group"),
    conditionItem: t("plan.bulk.criteria.conditionItem", "condition"),
    invalidTitle: t("plan.bulk.criteria.invalidTitle", "Incomplete condition (ERR-PLN-001)"),
    invalidBody: t("plan.bulk.criteria.invalidBody", "{n} condition(s) are missing a value. An incomplete condition is dropped rather than applied — fill it in or remove it before applying."),
    contributionLabel: t("plan.bulk.criteria.contributionLabel", "{n} match this condition alone — focus"),
    unfocusLabel: t("plan.bulk.criteria.unfocusLabel", "Clear focus"),
  };
  return (
    <Shell current="/planning" title={t("plan.bulk.title", "Plan multiple visits — criteria & targeting")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.bulk.context", "SCR-WEB-110 · AND/OR criteria builder")}</span>}>
      {ctWasInvalid && (
        <div className="ax-banner ax-banner--warning" role="alert" aria-label={t("plan.bulk.invalidCt.title", "Criteria could not be read")}>
          <strong>{t("plan.bulk.invalidCt.title", "Criteria could not be read")}</strong>
          <p>{t("plan.bulk.invalidCt.body", "The criteria link was invalid or corrupted (ERR-PLN-001) and could not be applied. Showing unfiltered results — please rebuild your criteria below.")}</p>
        </div>
      )}
      {/* MVP1-M01-016 / MVP1-M01-026 · AC-0016 / AC-0026 — contextual planning summary. */}
      <ContextualAiPanel
        surface="planning_summary"
        title={t("plan.bulk.ai.title", "AI planning summary")}
        description={t("plan.bulk.ai.description", "Evidence-linked advisory summary of the current factory scope. It never selects, ranks or publishes anything.")}
        context={aiPlanningContext}
        evidenceRefs={["AC-0016", "AC-0026", "M01-016", "M01-026", "SCR-WEB-110"]}
        generateLabel={t("plan.bulk.ai.generate", "Generate planning summary")}
        unavailableLabel={t("plan.bulk.ai.unavailable", "AI provider unavailable — nothing was generated or changed.")}
        evidenceLabel={t("plan.bulk.ai.evidence", "Source evidence")}
        advisoryLabel={t("plan.bulk.ai.advisory", "Advisory only · human decides")}
      />
      <TargetingLensClient
        initialTree={tree} fieldOptions={fieldOptions} matchCount={factories.length} criteriaStrings={criteriaStrings}
        contributions={contributions} leafInfo={leafInfo}
        denominator={denominator} eligible={factories.length} oldestSyncedAt={oldestSyncedAt} missingSync={missingSync} ledgerStrings={ledgerStrings}
        distributions={distributions} distStrings={distStrings}
        factories={factories as never} bulkFormStrings={strings} locale={locale === "ar" ? "ar" : "en"}
      />
    </Shell>
  );
}
