import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import BulkForm, { type BulkFormStrings } from "./BulkForm";
import CriteriaBuilder, { type CriteriaBuilderStrings } from "./CriteriaBuilder";
import EligibilityLedger, { type LedgerStrings } from "./EligibilityLedger";
import DistributionPanels, { type Bucket, type Distribution, type DistributionStrings } from "./DistributionPanels";
import { parseCt, fromFlat, evalNode, hasCriteria, emptyTree } from "./criteria";

export const dynamic = "force-dynamic";

type FactoryForCriteria = {
  region: string | null; risk_band: string | null; activity_class: string | null; city: string | null;
};

const toArr = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<{ ct?: string; cf?: string | string[]; co?: string | string[]; cv?: string | string[]; combine?: string }> }) {
  const sp = await searchParams;
  const { t } = await useT();
  const sb = await supabaseServer();
  // M01-003/012/022 — criteria tree. New `ct` param (nested ALL/ANY) is
  // authoritative; legacy cf/co/cv links still parse for backward compatibility.
  const tree = parseCt(sp.ct)
    ?? fromFlat(toArr(sp.cf), toArr(sp.co), toArr(sp.cv), sp.combine ?? "and")
    ?? emptyTree();
  // M01-004 — all factories fetched, then the tree evaluated server-side
  // (ALL = every child / ANY = some, nested). No DB-level .eq filters: is-not
  // and ANY combinations aren't simple equality, so evaluation is uniform here.
  const { data: allFactories } = await sb
    .from("factories")
    .select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, activity_class, official_lat, official_lng, source_synced_at, visits(planning_status, visit_type)")
    .order("risk_score", { ascending: false });
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
  // Freshness — real FND-013 factories.source_synced_at over the matched set.
  // We report the oldest sync time and how many rows lack it; we do NOT label
  // "stale" (no governed staleness threshold exists — inventing one is barred).
  const syncTimes = factories.map(f => (f as Record<string, unknown>).source_synced_at).filter((v): v is string => typeof v === "string");
  const oldestSyncedAt = syncTimes.length ? syncTimes.reduce((a, b) => (a < b ? a : b)) : null;
  const missingSync = factories.length - syncTimes.length;

  const ledgerStrings: LedgerStrings = {
    heading: t("plan.bulk.ledger.heading", "Eligibility ledger"),
    denominator: t("plan.bulk.ledger.denominator", "In scope"),
    eligible: t("plan.bulk.ledger.eligible", "Eligible (match criteria)"),
    excluded: t("plan.bulk.ledger.excluded", "Excluded by criteria"),
    freshness: t("plan.bulk.ledger.freshness", "Oldest registry sync"),
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
  };
  return (
    <Shell current="/planning" title={t("plan.bulk.title", "Bulk planning — criteria & targeting")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.bulk.context", "SCR-WEB-110 · AND/OR criteria builder")}</span>}>
      <CriteriaBuilder initialTree={tree} fieldOptions={fieldOptions}
        matchCount={factories.length} strings={criteriaStrings} />
      <EligibilityLedger denominator={denominator} eligible={factories.length}
        oldestSyncedAt={oldestSyncedAt} missingSync={missingSync} strings={ledgerStrings} />
      <DistributionPanels distributions={distributions} strings={distStrings} />
      <BulkForm factories={factories as never} strings={strings} />
    </Shell>
  );
}
