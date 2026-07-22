import Link from "next/link";
import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import VisitsBoard, { type VisitRow, type VisitsBoardStrings } from "./VisitsBoard";
import { getReasonOptions } from "@/lib/planning/lifecycle";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import WidgetBoundary from "@/components/WidgetBoundary";
import EmptyState from "@/components/EmptyState";
import { IconCalendar } from "@/app/icons";

const PAGE_STEP = 100;   // M02-020 — raised from the old 50 cap; load-more grows by this step
const PAGE_MAX = 1000;

type Joined = {
  id: string; visit_type: string; execution_mode: string; planning_status: string;
  operational_state: string; window_start: string; window_end: string;
  visit_plan_id: string | null;
  factories: { name: string; factory_code: string | null; cr_number: string | null; license_number: string | null; region: string | null; city: string | null } | null;
  visit_plans: { method: string } | null; // TO-ONE embed — object or null (null = immediate)
  assignments: { profiles: { full_name: string } | null }[] | null;
  inspections: { status: string } | null; // TO-ONE embed — object or null
};

export default async function Visits({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const sp = await searchParams;
  const limit = Math.min(Math.max(Number.parseInt(sp.limit ?? "", 10) || PAGE_STEP, PAGE_STEP), PAGE_MAX);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  // M02-016 expiry is owned by pg_cron sweep expire_lapsed_visits_scheduled
  // (0025, every 15 min, unscoped); boards render display-level 'expired' for
  // lapsed windows in between ticks. No per-page-load mutating RPC (K-009).
  const [{ data: visits, error, count }, { data: inspRows }] = await Promise.all([
    sb.from("visits")
      .select(`id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, visit_plan_id,
        factories(name, factory_code, cr_number, license_number, region, city),
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
    // CD-026 query-degraded — neutralise the provider error: raw Supabase/PostgREST
    // text is logged server-side only; the user sees stable neutral copy (no raw message).
    console.error(`[visits.list] load failed: ${error.message}`);
    return (
      <Shell current="/visits" title={t("visit.list.title", "Visit management")}>
        <div className="ax-banner ax-banner--critical" role="alert"><div>{t("visit.list.loadErrorNeutral", "Visits are temporarily unavailable. Please try again.")}</div></div>
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
      region: v.factories?.region ?? "",
      city: v.factories?.city ?? "",
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
  const regionOptions = distinct(rows.map(r => r.region).filter(Boolean)).map(v => ({ value: v, label: v }));
  const cityOptions = distinct(rows.map(r => r.city).filter(Boolean)).map(v => ({ value: v, label: v }));
  // M8 / PLN-CON-011 — governed cancellation reasons for the bulk-cancel form.
  const { options: cancelReasons } = await getReasonOptions(sb, "cancellation_reason");
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
    allRegions: t("visit.list.allRegions", "All regions"),
    allCities: t("visit.list.allCities", "All cities"),
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
    colOperational: t("visit.list.colOperational", "Visit status"),
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
    bulkCancelComments: t("visit.list.bulkCancelComments", "Cancellation comments"),
    bulkCancelPlaceholder: t("visit.list.bulkCancelPlaceholder", "mandatory when the reason is Other"),
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
    // CD-026 — continuity spine
    spineHeading: t("visit.spine.heading", "Selected visit"),
    spineEmpty: t("visit.spine.empty", "Select a visit to see its identity, state and allowed actions here — kept in view as you work."),
    spineOpenDetail: t("visit.spine.openDetail", "Open full detail"),
    spineWindow: t("visit.spine.window", "Window"),
    spineInspector: t("visit.spine.inspector", "Inspector"),
    spineAllowed: t("visit.spine.allowed", "Allowed actions"),
    previewAria: t("visit.spine.previewAria", "Show visit {id} in the selected-visit panel"),
    openDetailAria: t("visit.spine.openDetailAria", "Open full detail for visit {id}"),
    allowedEditable: t("visit.spine.allowedEditable", "Editable — published & not started"),
    allowedLocked: t("visit.spine.allowedLocked", "Locked — inspection started"),
    allowedFinal: t("visit.spine.allowedFinal", "Final — no further changes"),
    allowedExpired: t("visit.spine.allowedExpired", "Expired — read-only"),
    // CD-026 — eligibility preview
    eligHeading: t("visit.elig.heading", "Eligibility preview"),
    eligVerified: t("visit.elig.verified", "Verified now — each item is re-checked on the server at submit."),
    eligCount: t("visit.elig.count", "{n} of {total} eligible"),
    eligSamePlanBlocked: t("visit.elig.samePlanBlocked", "Bulk edit applies within one Plan. Cross-Plan enforcement is not yet in place on the server, so it is unavailable across Plans."),
    eligReschedule: t("visit.elig.reschedule", "Reschedule"),
    eligReassign: t("visit.elig.reassign", "Reassign"),
    eligCancel: t("visit.elig.cancel", "Cancel"),
    eligEdit: t("visit.elig.edit", "Edit"),
    // CD-026 — outcome ledger
    ledgerColVisit: t("visit.ledger.colVisit", "Visit"),
    ledgerColOutcome: t("visit.ledger.colOutcome", "Outcome"),
    ledgerColReason: t("visit.ledger.colReason", "What happened"),
    ledgerOpen: t("visit.ledger.open", "Open"),
    ledgerSummaryApplied: t("visit.ledger.summaryApplied", "{n} applied"),
    ledgerSummaryBlocked: t("visit.ledger.summaryBlocked", "{n} blocked before change"),
    ledgerSummaryNoNotif: t("visit.ledger.summaryNoNotif", "{n} changed — notification not queued"),
    ledgerRetrySafe: t("visit.ledger.retrySafe", "Blocked items were not changed and are safe to retry."),
    progressBusy: t("visit.ledger.progressBusy", "Applying to {n} visits…"),
    verbReschedule: t("visit.ledger.verbReschedule", "Reschedule result"),
    verbReassign: t("visit.ledger.verbReassign", "Reassign result"),
    verbCancel: t("visit.ledger.verbCancel", "Cancel result"),
    verbEdit: t("visit.ledger.verbEdit", "Edit result"),
    outcomeApplied: t("visit.outcome.applied", "Applied"),
    outcomeNoNotif: t("visit.outcome.noNotif", "Change applied — notification not queued"),
    ledgerShortNoNotif: t("visit.outcome.shortNoNotif", "Applied — no notification"),
    ledgerShortBlocked: t("visit.outcome.shortBlocked", "Blocked before change"),
    ledgerShortError: t("visit.outcome.shortError", "Not changed"),
    outcomeBlockedNotPub: t("visit.outcome.blockedNotPub", "Blocked before change — no longer published & unstarted, or outside your scope. Nothing changed."),
    outcomeBlockedStarted: t("visit.outcome.blockedStarted", "Blocked before change — the inspection has already started. Nothing changed."),
    outcomeBlockedNoAssign: t("visit.outcome.blockedNoAssign", "Blocked before change — no assignment to update, or outside your scope. Nothing changed."),
    outcomeError: t("visit.outcome.error", "Not changed — something went wrong. This item is safe to retry."),
    errSelectOne: t("visit.err.selectOne", "Select at least one visit."),
    errReasonRequired: t("visit.err.reasonRequired", "A governed cancellation reason is required (comments are mandatory for Other) — final."),
    errReasonsUnavailable: t("visit.err.reasonsUnavailable", "Cancellation reasons are temporarily unavailable (ERR-OPS-001) — nothing was changed."),
    errSession: t("visit.err.session", "Session expired — sign in again."),
    errWindowRequired: t("visit.err.windowRequired", "A new window start and end are both required."),
    errWindowInvalid: t("visit.err.windowInvalid", "Enter valid date and time values."),
    errWindowOrder: t("visit.err.windowOrder", "The window end must be after the window start."),
    errInspectorRequired: t("visit.err.inspectorRequired", "Select an inspector."),
    errTypeOrNotes: t("visit.err.typeOrNotes", "Choose a visit type to change, or tick “update notes”."),
  };
  return (
    <Shell current="/visits" title={t("visit.list.title", "Visit management")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("visit.list.context", "Filtered to your access")}</span>}>
      {/* FIX WAVE F4 — M02-038 calendar + M02-018/037 workload entry points.
          CD-026 — the Map lens is HANDOFF_BLOCKED_MAP: no route, provider or
          coordinate wiring exists, so it is shown UNAVAILABLE (disabled) and the
          authoritative list below is the working equivalent — never faked. */}
      <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: "var(--space-3)" }}>
        <div className="ax-row" role="group" aria-label={t("visit.views.aria", "Visit management views")}>
          <Link className="ax-btn ax-btn--secondary" aria-current="page" href="/visits" prefetch={false}>{t("visit.views.list", "List")}</Link>
          <Link className="ax-btn ax-btn--subtle" href="/visits/calendar" prefetch={false}>{t("visit.views.calendar", "Calendar")}</Link>
          <Link className="ax-btn ax-btn--subtle" href="/visits/workload" prefetch={false}>{t("visit.views.workload", "Workload")}</Link>
          <Link className="ax-btn ax-btn--subtle" href="/visits/map" prefetch={false}>{t("visit.views.map", "Map")}</Link>
        </div>
        {/* M8 — /planning is the accepted planning surface; the two are
            cross-linked in both directions (canonical §5/§6 reconciliation).
            The empty-state "Create a plan" link below only renders with zero
            rows, so the populated board needs its own always-visible route. */}
        <Link className="ax-btn ax-btn--subtle" href="/planning" prefetch={false}>{t("visit.list.planningLink", "Planning — drafts and plans →")}</Link>
        <span className="ax-caption ax-numeric">{t("visit.list.scope", "RLS-scoped — showing {shown} of {total}").replace("{shown}", String(Math.min(rows.length, limit))).replace("{total}", String(total))}</span>
      </div>
      {/* M10 / canonical §19 — the AI widget fails isolated; it can never
          blank the visit board. */}
      <WidgetBoundary label={t("visit.ai.unavailable", "AI summary unavailable — nothing was generated or changed.")}>
        <ContextualAiPanel surface="visit_management_summary" title={t("visit.ai.title", "Visit management summary")} description={t("visit.ai.description", "Advisory summary of the visits currently in your authorized scope. It cannot change a visit, assignment, state or campaign.")} context={JSON.stringify({ scope: "visit-management" })} evidenceRefs={["MVP1-M02-001", "MVP1-M02-002", "MVP1-M02-017", "MVP1-M02-035", "SCR-WEB-200"]} generateLabel={t("visit.ai.generate", "Generate operational summary")} unavailableLabel={t("visit.ai.unavailable", "AI summary unavailable — nothing was generated or changed.")} evidenceLabel={t("visit.ai.evidence", "Source references")} advisoryLabel={t("visit.ai.advisory", "Advisory only · human decides")} reviewLabel={t("visit.ai.review", "Review or reject this advisory")} />
      </WidgetBoundary>
      {rows.length === 0 ? (
        <EmptyState icon={<IconCalendar size={28} />} title={t("visit.list.empty", "No visits in your scope")}
          body={t("visit.list.emptyDesc", "Only visits inside your organizational scope are shown (M02-001 · RLS-enforced, not filtered client-side).")}>
          <Link className="ax-btn" href="/planning" prefetch={false}>{t("visit.list.createPlan", "Create a plan")}</Link>
        </EmptyState>
      ) : (
        <VisitsBoard rows={rows} inspectors={inspectors} typeOptions={typeOptions} modeOptions={modeOptions}
          regionOptions={regionOptions} cityOptions={cityOptions} cancelReasons={cancelReasons}
          total={total} limit={limit} nextLimit={nextLimit} strings={strings} locale={locale} />
      )}
    </Shell>
  );
}
