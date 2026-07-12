import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Wizard, { type WizardStrings } from "./Wizard";

export const dynamic = "force-dynamic";

export default async function SinglePlanning() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: factories }, { data: pkgs }, { data: inspRoles }] = await Promise.all([
    sb.from("factories").select("id, factory_code, name, cr_number, license_number, region, city, risk_band, risk_score, official_lat, official_lng, geofence_radius_m").order("name"),
    sb.from("package_versions").select("id, version_label, packages(code, title)").in("status", ["published", "locked"]).order("published_at", { ascending: false }),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
  ]);
  const inspectors = (inspRoles ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const strings: WizardStrings = {
    findFactory: t("plan.single.findFactory", "1 · Find factory — CR, code or Industrial License (M01-035)"),
    searchPlaceholder: t("plan.single.searchPlaceholder", "CR number, factory code or Industrial License"),
    noMatch: t("plan.single.noMatch", "No factory matches — check the number, or create an Immediate Visit (M01-045)."),
    crPrefix: t("plan.single.crPrefix", "CR"),
    licenseStep: t("plan.single.licenseStep", "2 · Industrial License (M01-036)"),
    licenseSelect: t("plan.single.licenseSelect", "Select the Industrial License this visit is planned against"),
    licenseLabel: t("plan.single.licenseLabel", "Industrial license"),
    licenseNone: t("plan.single.licenseNone", "No Industrial License on record for this factory — the visit proceeds against the CR (M01-036)."),
    locationStep: t("plan.single.locationStep", "3 · Confirm location (M01-038)"),
    officialPin: t("plan.single.officialPin", "Official factory pin"),
    noOfficialPin: t("plan.single.noOfficialPin", "No official location on record — pin the visit location manually below."),
    plannerLat: t("plan.single.plannerLat", "Planner pin latitude (optional override)"),
    plannerLng: t("plan.single.plannerLng", "Planner pin longitude (optional override)"),
    plannerPin: t("plan.single.plannerPin", "Planner pin (this visit only — official pin is GIS Admin owned)"),
    locationConfirmed: t("plan.single.locationConfirmed", "Location confirmed — publish is blocked until confirmed (M01-038)"),
    mapLoading: t("plan.single.mapLoading", "Loading location map"),
    configStep: t("plan.single.configStep", "4 · Configure & assign"),
    visitType: t("plan.single.visitType", "Visit type"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint-triggered"),
    packageLabel: t("plan.single.package", "Package (published only)"),
    mode: t("plan.single.mode", "Mode"),
    modePhysical: t("enum.physical", "Physical"),
    modeVirtual: t("enum.virtual", "Virtual"),
    windowStart: t("plan.single.windowStart", "Window start"),
    windowEnd: t("plan.single.windowEnd", "Window end"),
    inspector: t("plan.single.inspector", "Inspector (M01-040)"),
    selectOption: t("plan.single.select", "— select"),
    autoAssign: t("plan.single.autoAssign", "Auto-assign — first available inspector (M01-040)"),
    blockedTitle: t("plan.single.blocked", "Publishing blocked — work preserved (M01-041)"),
    publish: t("plan.single.publish", "Publish visit (one plan · one visit — M01-042)"),
    publishing: t("plan.single.publishing", "Publishing…"),
    riskBands: {
      high: t("enum.high", "high"),
      medium: t("enum.medium", "medium"),
      low: t("enum.low", "low"),
    },
  };
  return (
    <Shell current="/planning" title={t("plan.single.title", "Single visit planning")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("plan.single.context", "SCR-WEB-120/140/150 · golden #2 as product")}</span>}>
      <Wizard factories={(factories ?? []) as never} packages={(pkgs ?? []) as never} inspectors={inspectors} strings={strings} />
    </Shell>
  );
}
