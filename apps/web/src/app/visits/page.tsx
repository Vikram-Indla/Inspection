import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import VisitsBoard, { type VisitRow, type VisitsBoardStrings } from "./VisitsBoard";

export const dynamic = "force-dynamic";

const PAGE_STEP = 100;   // M02-020 — raised from the old 50 cap; load-more grows by this step
const PAGE_MAX = 1000;

type Joined = {
  id: string; visit_type: string; execution_mode: string; planning_status: string;
  operational_state: string; window_start: string; window_end: string;
  visit_plan_id: string | null;
  factories: { name: string; factory_code: string | null; cr_number: string | null; license_number: string | null } | null;
  visit_plans: { method: string } | null; // TO-ONE embed — object or null (null = immediate)
  assignments: { profiles: { full_name: string } | null }[] | null;
  inspections: { status: string } | null; // TO-ONE embed — object or null
};

export default async function Visits({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const sp = await searchParams;
  const limit = Math.min(Math.max(Number.parseInt(sp.limit ?? "", 10) || PAGE_STEP, PAGE_STEP), PAGE_MAX);
  const { t } = await useT();
  const sb = await supabaseServer();
  // M02-016 — persist published→expired before reading (parity with field home;
  // security-definer rpc runs the canonical transition, audit trigger records it).
  await sb.rpc("expire_lapsed_visits");
  const [{ data: visits, error, count }, { data: inspRows }] = await Promise.all([
    sb.from("visits")
      .select(`id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, visit_plan_id,
        factories(name, factory_code, cr_number, license_number),
        visit_plans(method),
        assignments(profiles(full_name)),
        inspections(status)`, { count: "exact" })
      .order("window_start", { ascending: true }).limit(limit),
    // ENG-05 — inspector pool for bulk reassign (disambiguated embed, detail-page canon)
    sb.from("profiles")
      .select("user_id, full_name, user_roles!user_roles_user_id_fkey!inner(role_key)")
      .eq("user_roles.role_key", "inspector").order("full_name"),
  ]);
  if (error) {
    return (
      <Shell current="/visits" title={t("visit.list.title", "Visit management")}>
        <div className="ax-banner ax-banner--critical"><div>{t("visit.list.loadError", "Could not load visits:")} {error.message}</div></div>
      </Shell>
    );
  }
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id as string, full_name: r.full_name as string }));
  const rows: VisitRow[] = ((visits ?? []) as unknown as Joined[]).map(v => {
    const asg = v.assignments?.[0];
    return {
      id: v.id,
      visitType: v.visit_type,
      executionMode: v.execution_mode,
      planningStatus: v.planning_status,
      operationalState: v.operational_state,
      windowStart: v.window_start,
      windowEnd: v.window_end,
      factoryName: v.factories?.name ?? "—",
      factoryCode: v.factories?.factory_code ?? "",
      crNumber: v.factories?.cr_number ?? "",
      licenseNumber: v.factories?.license_number ?? "",
      planId: v.visit_plan_id ?? "",
      planMethod: v.visit_plans?.method ?? "",
      inspectorName: asg?.profiles?.full_name ?? "",
      inspectionStatus: v.inspections?.status ?? null,
      typeLabel: t(`enum.${v.visit_type}`, v.visit_type),
      modeLabel: t(`enum.${v.execution_mode}`, v.execution_mode),
      planningLabel: t(`enum.${v.planning_status}`, v.planning_status),
      opsLabel: t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " ")),
    };
  });
  const distinct = (vals: string[]) => [...new Set(vals)].sort();
  const typeOptions = distinct(rows.map(r => r.visitType)).map(v => ({ value: v, label: t(`enum.${v}`, v) }));
  const modeOptions = distinct(rows.map(r => r.executionMode)).map(v => ({ value: v, label: t(`enum.${v}`, v) }));
  const total = count ?? rows.length;
  const nextLimit = rows.length < total && limit < PAGE_MAX ? Math.min(limit + PAGE_STEP, PAGE_MAX) : null;
  const strings: VisitsBoardStrings = {
    searchPlaceholder: t("visit.list.searchPlaceholder", "Visit ID, Plan/Campaign ID, factory, CR, license or inspector…"),
    searchAria: t("visit.list.searchAria", "Search visits — including Plan ID and Campaign (M02-021)"),
    campaignLabel: t("visit.list.campaignLabel", "Campaign"),
    planLabel: t("visit.list.planLabel", "Plan"),
    allStatuses: t("visit.list.allStatuses", "All statuses"),
    allTypes: t("visit.list.allTypes", "All types"),
    allModes: t("visit.list.allModes", "All modes"),
    fromDate: t("visit.list.fromDate", "Window from"),
    toDate: t("visit.list.toDate", "Window to"),
    sortAria: t("visit.list.sortAria", "Sort visits"),
    sortWindowAsc: t("visit.list.sortWindowAsc", "Window — earliest first"),
    sortWindowDesc: t("visit.list.sortWindowDesc", "Window — latest first"),
    sortFactory: t("visit.list.sortFactory", "Factory name"),
    clearFilters: t("visit.list.clearFilters", "Clear filters"),
    statusLabels: {
      draft: t("enum.draft", "draft"),
      published: t("enum.published", "published"),
      returned: t("enum.returned", "returned"),
      cancelled: t("enum.cancelled", "cancelled"),
      expired: t("enum.expired", "expired"),
    },
    kpiFilterHint: t("visit.list.kpiFilterHint", "Status counts — select one to filter the list (M02-002)"),
    colVisit: t("visit.list.colVisit", "Visit"),
    colFactory: t("visit.list.colFactory", "Factory"),
    colTypeMode: t("visit.list.colTypeMode", "Type · mode"),
    colPlanning: t("visit.list.colPlanning", "Planning status"),
    colOperational: t("visit.list.colOperational", "Operational"),
    colInspector: t("visit.list.colInspector", "Inspector"),
    colWindow: t("visit.list.colWindow", "Window"),
    selectAllAria: t("visit.list.selectAllAria", "Select all visible visits"),
    selectRowAria: t("visit.list.selectRowAria", "Select visit {id}"),
    selectedCount: t("visit.list.selectedCount", "{n} selected"),
    bulkHeading: t("visit.list.bulkHeading", "Bulk actions — per-row guards apply (M02-007/011)"),
    bulkWindowStart: t("visit.list.bulkWindowStart", "New window start (M02-033)"),
    bulkWindowEnd: t("visit.list.bulkWindowEnd", "New window end"),
    bulkRescheduleBtn: t("visit.list.bulkRescheduleBtn", "Reschedule selected"),
    bulkReassignTo: t("visit.list.bulkReassignTo", "Reassign to (M02-032)"),
    bulkReassignBtn: t("visit.list.bulkReassignBtn", "Reassign selected"),
    selectOption: t("visit.list.selectOption", "— select"),
    bulkCancelReason: t("visit.list.bulkCancelReason", "Cancellation reason *"),
    bulkCancelPlaceholder: t("visit.list.bulkCancelPlaceholder", "mandatory — M02-011, final"),
    bulkCancelBtn: t("visit.list.bulkCancelBtn", "Cancel selected"),
    bulkEditType: t("visit.list.bulkEditType", "New visit type"),
    bulkEditNotes: t("visit.list.bulkEditNotes", "New notes"),
    bulkEditNotesPlaceholder: t("visit.list.bulkEditNotesPlaceholder", "leave blank to clear"),
    bulkEditSetNotes: t("visit.list.bulkEditSetNotes", "Update notes"),
    bulkEditBtn: t("visit.list.bulkEditBtn", "Apply to selected"),
    typePeriodic: t("enum.periodic", "Periodic compliance"),
    typeFollowUp: t("enum.follow_up", "Follow-up"),
    typeComplaint: t("enum.complaint", "Complaint-triggered"),
    clearSelection: t("visit.list.clearSelection", "Clear selection"),
    noMatch: t("visit.list.noMatch", "No visits match the current search and filters."),
    showing: t("visit.list.showing", "Showing {shown} of {total} visits"),
    loadMore: t("visit.list.loadMore", "Load more"),
    expiredLabel: t("enum.expired", "expired"),
  };
  return (
    <Shell current="/visits" title={t("visit.list.title", "Visit management")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("visit.list.context", "SCR-WEB-200/210 · RLS-scoped")}</span>}>
      {/* FIX WAVE F4 — M02-038 calendar + M02-018/037 workload entry points */}
      <div className="ax-row" role="group" aria-label={t("visit.views.aria", "Visit management views")}>
        <a className="ax-btn ax-btn--secondary" aria-current="page" href="/visits">{t("visit.views.list", "List")}</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/calendar">{t("visit.views.calendar", "Calendar")}</a>
        <a className="ax-btn ax-btn--subtle" href="/visits/workload">{t("visit.views.workload", "Workload")}</a>
      </div>
      {rows.length === 0 ? (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">🗓</span><h4>{t("visit.list.empty", "No visits in your scope")}</h4>
          <p className="ax-caption">{t("visit.list.emptyDesc", "Only visits inside your organizational scope are shown (M02-001 · RLS-enforced, not filtered client-side).")}</p>
          <a className="ax-btn" href="/planning">{t("visit.list.createPlan", "Create a plan")}</a>
        </div></div>
      ) : (
        <VisitsBoard rows={rows} inspectors={inspectors} typeOptions={typeOptions} modeOptions={modeOptions}
          total={total} limit={limit} nextLimit={nextLimit} strings={strings} />
      )}
    </Shell>
  );
}
