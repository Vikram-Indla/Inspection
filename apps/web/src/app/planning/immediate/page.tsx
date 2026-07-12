import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import ImmediateForm, { type ImmediateStrings } from "./ImmediateForm";

export const dynamic = "force-dynamic";

export default async function Immediate() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: factories }, { data: pkgs }, { data: inspRows }] = await Promise.all([
    sb.from("factories").select("id, name, factory_code, cr_number, license_number").eq("is_temporary", false).order("name"),
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"]),
    sb.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey(full_name)").eq("role_key", "inspector"),
  ]);
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  const strings: ImmediateStrings = {
    identity: t("plan.imm.identity", "Identity — registered or minimum manual (M01-044/045)"),
    searchLabel: t("plan.imm.searchLabel", "Search registered factories — CR or Industrial License (M01-044)"),
    searchPlaceholder: t("plan.imm.searchPlaceholder", "CR number, Industrial License or name"),
    searchNoMatch: t("plan.imm.searchNoMatch", "No registered factory matches — capture the details manually below (M01-045)."),
    existingFactory: t("plan.imm.existingFactory", "Existing factory (optional)"),
    noneUnregistered: t("plan.imm.noneUnregistered", "— none / unregistered"),
    manualName: t("plan.imm.manualName", "Or factory name (unregistered)"),
    manualPlaceholder: t("plan.imm.manualPlaceholder", "As observed / reported — becomes a flagged temporary entity"),
    manualCr: t("plan.imm.manualCr", "CR number (optional)"),
    manualLicense: t("plan.imm.manualLicense", "Industrial License (optional)"),
    manualActivity: t("plan.imm.manualActivity", "Business activity (optional)"),
    manualActivityPlaceholder: t("plan.imm.manualActivityPlaceholder", "Any available business information — stored with the temporary entity"),
    urgencyReason: t("plan.imm.urgencyReason", "Urgency reason *"),
    selectOption: t("plan.imm.select", "— select"),
    reasonComplaint: t("plan.imm.reasonComplaint", "Complaint received"),
    reasonIncident: t("plan.imm.reasonIncident", "Incident report"),
    reasonReferral: t("plan.imm.reasonReferral", "Authority referral"),
    locationDispatch: t("plan.imm.locationDispatch", "Location (mandatory — M01-046) & dispatch"),
    latitude: t("plan.imm.latitude", "Latitude *"),
    longitude: t("plan.imm.longitude", "Longitude *"),
    packageLabel: t("plan.imm.package", "Package *"),
    inspector: t("plan.imm.inspector", "Inspector * (planner-created requires assignment — M01-048)"),
    blockedTitle: t("plan.imm.blocked", "Cannot create — minimum controls (P01)"),
    create: t("plan.imm.create", "Create & dispatch (Visit ID directly, no plan — M01-050)"),
    creating: t("plan.imm.creating", "Dispatching…"),
  };
  return (
    <Shell current="/planning" title={t("plan.imm.title", "Immediate visit — urgent dispatch")}
      context={<span className="ax-lozenge ax-lozenge--warning">{t("plan.imm.context", "SCR-WEB-130 · bypasses Visit Plans (M01-050)")}</span>}>
      <ImmediateForm factories={(factories ?? []) as never} packages={(pkgs ?? []) as never} inspectors={inspectors} strings={strings} />
    </Shell>
  );
}
