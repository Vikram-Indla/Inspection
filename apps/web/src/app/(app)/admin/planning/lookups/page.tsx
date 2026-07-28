import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";
import LookupsAdmin, { type LookupRow, type LookupsLabels } from "./LookupsAdmin";
import { LOOKUP_KINDS } from "./constants";

// M9 / PLN-CON-012 — planning lookups governance. The governed reference data
// (visit types, reasons, priorities, …) that feeds every planning select is
// edited here, gated on planning.configure_lookups. RLS remains the write
// authority; every change is audited by trg_audit_planning_lookups. Rows are
// never deleted — deactivation is the governed retirement.
export const dynamic = "force-dynamic";

export default async function PlanningLookups() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);

  const { data: canConfigureLookups, error: gateError } = user
    ? await sb.rpc("has_planning_capability", { p_capability: "planning.configure_lookups" })
    : { data: false, error: null };
  if (gateError) logProviderError("admin planning lookups gate", gateError);
  const canConfigure = canConfigureLookups === true;

  const { data, error } = await sb
    .from("planning_lookups")
    .select("id, kind, key, label_en, label_ar, is_active, sort_order, metadata")
    .order("kind")
    .order("sort_order")
    .order("key");
  if (error) logProviderError("admin planning lookups read", error);
  const rows = ((data ?? []) as LookupRow[]).map(r => ({
    ...r,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
  }));

  const labels: LookupsLabels = {
    addTitle: t("admin.planning.lookups.add", "Add lookup value"),
    kind: t("admin.planning.lookups.kind", "Kind"),
    key: t("admin.planning.lookups.key", "Key"),
    labelEn: t("admin.planning.lookups.labelEn", "English label"),
    labelAr: t("admin.planning.lookups.labelAr", "Arabic label"),
    sortOrder: t("admin.planning.lookups.sortOrder", "Sort order"),
    flagsTitle: t("admin.planning.lookups.flags", "Eligibility flags"),
    rawJson: t("admin.planning.lookups.rawJson", "Raw metadata override (JSON)"),
    rawJsonHint: t("admin.planning.lookups.rawJsonHint", "Optional. A non-empty JSON object replaces ALL metadata for this row."),
    save: t("common.save", "Save"),
    add: t("admin.planning.lookups.addBtn", "Add value"),
    edit: t("common.edit", "Edit"),
    closeEdit: t("common.cancel", "Cancel"),
    deactivate: t("admin.planning.lookups.deactivate", "Deactivate"),
    activate: t("admin.planning.lookups.activate", "Activate"),
    working: t("common.working", "Applying…"),
    colKey: t("admin.planning.lookups.col.key", "Key"),
    colLabels: t("admin.planning.lookups.col.labels", "Labels"),
    colFlags: t("admin.planning.lookups.col.flags", "Flags"),
    colStatus: t("admin.planning.lookups.col.status", "Status"),
    colActions: t("admin.planning.lookups.col.actions", "Actions"),
    active: t("admin.planning.lookups.active", "active"),
    inactive: t("admin.planning.lookups.inactive", "inactive"),
    readOnlyWhy: t("admin.planning.lookups.readOnly", "Read-only: configuring planning lookups requires the planning.configure_lookups capability. A security administrator can grant it under Roles & permissions."),
    deleteNote: t("admin.planning.lookups.deleteNote", "Lookup values are never deleted — history and existing records keep referring to them. Deactivation retires a value: governed selects only read active rows."),
  };

  return (
    <Shell current="/admin/planning/lookups" title={t("admin.planning.lookups.title", "Planning lookups")}
      context={<span className="sq-lozenge sq-lozenge--info">PLN-CON-012 · planning.configure_lookups</span>}>
      <div className="sq-banner"><div>
        <strong>{t("admin.planning.lookups.banner.title", "Governed reference data for planning.")}</strong>{" "}
        {t("admin.planning.lookups.banner.body", "These values feed every planning select (visit types, reasons, priorities). RLS is the write authority and every change is recorded in the audit trail with the actor and before/after state.")}
      </div></div>
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("admin.planning.lookups.error", "Couldn’t load lookups. Nothing was changed. Try again.")}</strong></div></div>}
      <LookupsAdmin rows={rows} kinds={[...LOOKUP_KINDS]} canConfigure={canConfigure} labels={labels} />
    </Shell>
  );
}
