import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import ExpiryAdmin, { type ExpiryLabels } from "./ExpiryAdmin";
import { RULE_TYPES, type ExpiryRuleRow, type ExpiryScope } from "./types";

// M9 / PLN-CON-013 — planning expiry rules governance. The rules that drive
// the 15-minute pg_cron expiry sweep (expire_lapsed_visits_scheduled) are
// edited here, gated on planning.configure_expiry. RLS remains the write
// authority; every change is audited by trg_audit_planning_expiry_rules.
export const dynamic = "force-dynamic";

export default async function PlanningExpiry() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: canConfigureExpiry, error: gateError } = user
    ? await sb.rpc("has_planning_capability", { p_capability: "planning.configure_expiry" })
    : { data: false, error: null };
  if (gateError) logProviderError("admin planning expiry gate", gateError);
  const canConfigure = canConfigureExpiry === true;

  const { data, error } = await sb
    .from("planning_expiry_rules")
    .select("id, rule_type, enabled, scope, offset_minutes, reason, notify_plan_creator, notify_inspector, version, effective_from, effective_to")
    .order("rule_type")
    .order("version", { ascending: false });
  if (error) logProviderError("admin planning expiry read", error);
  const rows = ((data ?? []) as unknown as (Omit<ExpiryRuleRow, "scope"> & { scope: unknown })[]).map(r => ({
    ...r,
    scope: (r.scope ?? null) as ExpiryScope | null,
  })) as ExpiryRuleRow[];

  const labels: ExpiryLabels = {
    readOnlyWhy: t("admin.planning.expiry.readOnly", "Read-only: configuring expiry rules requires the planning.configure_expiry capability. A security administrator can grant it under Roles & permissions."),
    ruleTypes: {
      no_acknowledgement: t("admin.planning.expiry.type.no_acknowledgement", "No acknowledgement"),
      no_execution_date: t("admin.planning.expiry.type.no_execution_date", "No execution date"),
      no_execution_start: t("admin.planning.expiry.type.no_execution_start", "No execution start"),
      not_completed_at_window_end: t("admin.planning.expiry.type.not_completed_at_window_end", "Not completed at window end"),
    },
    colVersion: t("admin.planning.expiry.col.version", "Version"),
    colStatus: t("admin.planning.expiry.col.status", "Status"),
    colOffset: t("admin.planning.expiry.col.offset", "Offset"),
    colReason: t("admin.planning.expiry.col.reason", "Reason"),
    colNotify: t("admin.planning.expiry.col.notify", "Notify"),
    colScope: t("admin.planning.expiry.col.scope", "Scope"),
    colEffective: t("admin.planning.expiry.col.effective", "Effective"),
    colActions: t("admin.planning.expiry.col.actions", "Actions"),
    enabled: t("admin.planning.expiry.enabled", "enabled"),
    disabled: t("admin.planning.expiry.disabled", "disabled"),
    enable: t("admin.planning.expiry.enable", "Enable"),
    disable: t("admin.planning.expiry.disable", "Disable"),
    edit: t("common.edit", "Edit"),
    closeEdit: t("common.cancel", "Cancel"),
    save: t("common.save", "Save"),
    newVersion: t("admin.planning.expiry.newVersion", "New version"),
    createVersion: t("admin.planning.expiry.createVersion", "Create version (disabled)"),
    working: t("common.working", "Applying…"),
    offsetLabel: t("admin.planning.expiry.offset", "Offset (minutes)"),
    reasonLabel: t("admin.planning.expiry.reasonLabel", "Reason (recorded in audit)"),
    notifyPlanCreator: t("admin.planning.expiry.notifyPlanCreator", "Notify plan creator"),
    notifyInspector: t("admin.planning.expiry.notifyInspector", "Notify inspector"),
    scopeVisitType: t("admin.planning.expiry.scopeVisitType", "Visit type"),
    scopeExecutionMode: t("admin.planning.expiry.scopeExecutionMode", "Execution mode"),
    scopePriority: t("admin.planning.expiry.scopePriority", "Priority"),
    any: t("admin.planning.expiry.any", "Any"),
    allVisits: t("admin.planning.expiry.allVisits", "All visits"),
    minutes: t("admin.planning.expiry.minutes", "min"),
    effectiveFrom: t("admin.planning.expiry.effectiveFrom", "from"),
    ongoing: t("admin.planning.expiry.ongoing", "ongoing"),
    noVersions: t("admin.planning.expiry.noVersions", "No versions of this rule type exist yet."),
    schedulerNote: t("admin.planning.expiry.schedulerNote", "These rules are evaluated every 15 minutes by the pg_cron job expire_lapsed_visits_scheduled. Only the enabled version of each rule type applies; a change takes effect on the next sweep."),
    scopeOptions: {
      visit_type: {
        periodic: t("admin.planning.expiry.visitType.periodic", "Periodic"),
        follow_up: t("admin.planning.expiry.visitType.followUp", "Follow-up"),
        complaint: t("admin.planning.expiry.visitType.complaint", "Complaint"),
      },
      execution_mode: {
        physical: t("admin.planning.expiry.execMode.physical", "Physical"),
        virtual: t("admin.planning.expiry.execMode.virtual", "Virtual"),
        administrative: t("admin.planning.expiry.execMode.administrative", "Administrative"),
      },
      priority: {
        low: t("admin.planning.expiry.priority.low", "Low"),
        medium: t("admin.planning.expiry.priority.medium", "Medium"),
        high: t("admin.planning.expiry.priority.high", "High"),
        urgent: t("admin.planning.expiry.priority.urgent", "Urgent"),
      },
    },
  };

  return (
    <Shell current="/admin/planning/expiry" title={t("admin.planning.expiry.title", "Planning expiry rules")}
      context={<span className="sq-lozenge sq-lozenge--info">PLN-CON-013 · planning.configure_expiry</span>}>
      <div className="sq-banner"><div>
        <strong>{t("admin.planning.expiry.banner.title", "One enabled version per rule type.")}</strong>{" "}
        {t("admin.planning.expiry.banner.body", "Enabling a version retires every other version of that rule type. New versions are created disabled so nothing changes silently; every change is recorded in the audit trail.")}
      </div></div>
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("admin.planning.expiry.error", "Couldn’t load expiry rules. Nothing was changed. Try again.")}</strong></div></div>}
      <ExpiryAdmin rows={rows} canConfigure={canConfigure} labels={labels} />
    </Shell>
  );
}
