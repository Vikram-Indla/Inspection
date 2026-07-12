import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import BulkForm, { type BulkFormStrings } from "./BulkForm";

export const dynamic = "force-dynamic";

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<{ region?: string; band?: string }> }) {
  const { region, band } = await searchParams;
  const { t } = await useT();
  const sb = await supabaseServer();
  let q = sb.from("factories").select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, visits(planning_status, visit_type)").order("risk_score", { ascending: false });
  if (region) q = q.eq("region", region);
  if (band) q = q.eq("risk_band", band);
  const [{ data: factories }, { data: pkgs }, { data: inspRows }] = await Promise.all([
    q,
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"]),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
  ]);
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const strings: BulkFormStrings = {
    colFactory: t("plan.bulk.colFactory", "Factory"),
    colCr: t("plan.bulk.colCr", "CR"),
    colCity: t("plan.bulk.colCity", "City"),
    colRisk: t("plan.bulk.colRisk", "Risk"),
    colEligibility: t("plan.bulk.colEligibility", "Eligibility"),
    colInspector: t("plan.bulk.colInspector", "Inspector (M01-029)"),
    selectFactory: t("plan.bulk.selectFactory", "select {name}"),
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
  return (
    <Shell current="/planning" title={t("plan.bulk.title", "Bulk planning — criteria & targeting")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.bulk.context", "SCR-WEB-110 · AND criteria via filters")}</span>}>
      <form method="get" className="ax-commandbar">
        <select className="ax-select" name="region" defaultValue={region ?? ""} style={{ maxInlineSize: 200 }}>
          <option value="">{t("plan.bulk.regionAny", "Region: any")}</option><option value="Riyadh">{t("region.riyadh", "Riyadh")}</option>
        </select>
        <select className="ax-select" name="band" defaultValue={band ?? ""} style={{ maxInlineSize: 200 }}>
          <option value="">{t("plan.bulk.bandAny", "Risk band: any")}</option><option value="high">{t("enum.high", "high")}</option><option value="medium">{t("enum.medium", "medium")}</option><option value="low">{t("enum.low", "low")}</option>
        </select>
        <button className="ax-btn ax-btn--secondary">{t("plan.bulk.search", "Search")}</button>
        <span className="ax-caption ax-numeric">{t("plan.bulk.matching", "{n} matching factories (M01-004: all matching returned)").replace("{n}", String((factories ?? []).length))}</span>
      </form>
      <BulkForm factories={(factories ?? []) as never} packages={(pkgs ?? []) as never} inspectors={inspectors} strings={strings} />
    </Shell>
  );
}
