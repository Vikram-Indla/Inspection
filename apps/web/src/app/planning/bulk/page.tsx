import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import BulkForm, { type BulkFormStrings } from "./BulkForm";
import CriteriaBuilder, { type Condition, type CriteriaBuilderStrings } from "./CriteriaBuilder";

export const dynamic = "force-dynamic";

// M01-003/012/022 — criteria fields the builder targets over the factory set.
const CRITERIA_FIELDS = ["region", "risk_band", "activity_class", "city"] as const;
type FactoryForCriteria = {
  region: string | null; risk_band: string | null; activity_class: string | null; city: string | null;
};

const toArr = (v: string | string[] | undefined): string[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

function matchesCondition(f: FactoryForCriteria, c: Condition): boolean {
  const fv = String((f as Record<string, unknown>)[c.field] ?? "").toLowerCase().trim();
  const tv = c.value.toLowerCase().trim();
  const equal = fv === tv;
  return c.op === "is-not" ? !equal : equal;
}

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<{ cf?: string | string[]; co?: string | string[]; cv?: string | string[]; combine?: string }> }) {
  const sp = await searchParams;
  const { t } = await useT();
  const sb = await supabaseServer();
  // M01-003/012/022 — parse index-aligned cf/co/cv arrays into conditions; drop
  // rows with an unknown field or an empty value (an in-progress blank row).
  const cf = toArr(sp.cf), co = toArr(sp.co), cv = toArr(sp.cv);
  const conditions: Condition[] = cf
    .map((field, i) => ({ field, op: co[i] === "is-not" ? "is-not" : "is", value: (cv[i] ?? "").trim() }))
    .filter(c => (CRITERIA_FIELDS as readonly string[]).includes(c.field) && c.value !== "");
  const combine = sp.combine === "or" ? "or" : "and";
  // M01-004 — all matching factories are fetched, then the criteria are evaluated
  // server-side (AND = every / OR = some). No DB-level .eq filters: is-not and OR
  // combinations cannot be expressed as simple equality filters, so evaluation is
  // uniform in one place.
  const [{ data: allFactories }, { data: pkgs }, { data: inspRows }] = await Promise.all([
    sb.from("factories").select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, activity_class, visits(planning_status, visit_type)").order("risk_score", { ascending: false }),
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"]),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
  ]);
  const everyFactory = (allFactories ?? []) as unknown as (FactoryForCriteria & Record<string, unknown>)[];
  const factories = conditions.length === 0
    ? everyFactory
    : everyFactory.filter(f => combine === "or"
      ? conditions.some(c => matchesCondition(f, c))
      : conditions.every(c => matchesCondition(f, c)));
  // Distinct value lists per field (datalist suggestions in the builder).
  const distinct = (key: string) => [...new Set(everyFactory.map(f => (f as Record<string, unknown>)[key]).filter((v): v is string => typeof v === "string" && v.length > 0))].sort();
  const fieldOptions: Record<string, string[]> = {
    region: distinct("region"), risk_band: distinct("risk_band"),
    activity_class: distinct("activity_class"), city: distinct("city"),
  };
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const strings: BulkFormStrings = {
    colFactory: t("plan.bulk.colFactory", "Factory"),
    colCr: t("plan.bulk.colCr", "CR"),
    colCity: t("plan.bulk.colCity", "City"),
    colRisk: t("plan.bulk.colRisk", "Risk"),
    colEligibility: t("plan.bulk.colEligibility", "Eligibility"),
    colInspector: t("plan.bulk.colInspector", "Inspector (M01-029)"),
    selectFactory: t("plan.bulk.selectFactory", "select {name}"),
    selectAllAria: t("plan.bulk.selectAll", "select all eligible factories"),
    inspectorFor: t("plan.bulk.inspectorFor", "inspector for {name}"),
    autoAssign: t("plan.bulk.autoAssign", "Auto (round-robin)"),
    sharedWarning: t("plan.bulk.sharedWarning", "also picked for {n} other visits in this window"),
    duplicate: t("plan.bulk.duplicate", "duplicate — active visit (M02-012)"),
    eligible: t("plan.bulk.eligible", "eligible"),
    visitType: t("plan.bulk.visitType", "Visit type (shared — M01-006)"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    packageLabel: t("plan.bulk.package", "Package"),
    windowStart: t("plan.bulk.windowStart", "Window start"),
    windowEnd: t("plan.bulk.windowEnd", "Window end"),
    notes: t("plan.bulk.notes", "Notes (optional, applied to every visit in this plan)"),
    notesPlaceholder: t("plan.bulk.notesPlaceholder", "Anything inspectors or reviewers should know before these visits…"),
    conflictsTitle: t("plan.bulk.conflictsTitle", "Conflicts detected — duplicate active visits (M02-012)"),
    conflictLine: t("plan.bulk.conflictLine", "{name} · already has an active visit of this type"),
    skipDuplicates: t("plan.bulk.skipDuplicates", "Skip conflicting factories at publish instead of blocking"),
    summaryTitle: t("plan.bulk.summaryTitle", "Campaign summary — deterministic, pre-publish (M01-016/026)"),
    summarySelected: t("plan.bulk.summarySelected", "Selected factories"),
    summaryByBand: t("plan.bulk.summaryByBand", "By risk band"),
    summaryByRegion: t("plan.bulk.summaryByRegion", "By region"),
    summaryType: t("plan.bulk.summaryType", "Visit type"),
    summaryMode: t("plan.bulk.summaryMode", "Mode"),
    summaryModePhysical: t("enum.physical", "Physical"),
    summaryAssignment: t("plan.bulk.summaryAssignment", "Assignment"),
    summaryManualN: t("plan.bulk.summaryManualN", "{n} manual"),
    summaryAutoN: t("plan.bulk.summaryAutoN", "{n} auto"),
    summaryEmpty: t("plan.bulk.summaryEmpty", "Select factories to build the campaign summary."),
    blockedTitle: t("plan.bulk.blocked", "Publish blocked (all-or-nothing — P03)"),
    publish: t("plan.bulk.publish", "Publish plan — every visit gets its own ID sharing the plan ID (M01-002)"),
    publishing: t("plan.bulk.publishing", "Publishing…"),
    riskBands: { high: t("enum.high", "high"), medium: t("enum.medium", "medium"), low: t("enum.low", "low") },
  };
  const criteriaStrings: CriteriaBuilderStrings = {
    heading: t("plan.bulk.criteria.heading", "Targeting criteria (M01-003/012/022)"),
    combineLabel: t("plan.bulk.criteria.combineLabel", "Combine conditions"),
    combineAnd: t("plan.bulk.criteria.combineAnd", "AND — match every condition"),
    combineOr: t("plan.bulk.criteria.combineOr", "OR — match any condition"),
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
    remove: t("plan.bulk.criteria.remove", "Remove"),
    apply: t("plan.bulk.criteria.apply", "Apply criteria"),
    clear: t("plan.bulk.criteria.clear", "Clear all"),
    matching: t("plan.bulk.matching", "{n} matching factories (M01-004: all matching returned)"),
    hint: t("plan.bulk.criteria.hint", "Conditions are evaluated server-side over every factory in your scope — is-not and OR combinations included."),
  };
  return (
    <Shell current="/planning" title={t("plan.bulk.title", "Bulk planning — criteria & targeting")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.bulk.context", "SCR-WEB-110 · AND/OR criteria builder")}</span>}>
      <CriteriaBuilder initial={conditions} initialCombine={combine} fieldOptions={fieldOptions}
        matchCount={factories.length} strings={criteriaStrings} />
      <BulkForm factories={factories as never} packages={(pkgs ?? []) as never} inspectors={inspectors} strings={strings} />
    </Shell>
  );
}
