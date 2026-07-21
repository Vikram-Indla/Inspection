import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import LineChart from "@/components/charts/LineChart";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import FieldHome, { type FieldHomeStrings, type FieldNotification, type FieldVisit } from "@/components/field/FieldHome";
import ContextualAiPanel from "@/components/ContextualAiPanel";

// visits -> inspections is TO-ONE (object | null, NOT array) — do not regress.
// inspections -> reviews / submission_versions are TO-MANY (arrays).
type Inspection = {
  id: string;
  status: string;
  reviews: { status: string; decided_at: string | null }[] | null;
  submission_versions: { submitted_at: string }[] | null;
};
type VisitCard = {
  id: string;
  visit_type: string;
  execution_mode: string;
  planning_status: string;
  window_start: string;
  window_end: string;
  factories: { name: string; factory_code: string; city: string; official_lat: number | null; official_lng: number | null } | null;
  inspections: Inspection | null;
};

function byMonth(dates: string[], locale: string): { label: string; value: number }[] {
  const agg = new Map<string, number>();
  for (const d of dates) {
    const key = d.slice(0, 7); // YYYY-MM
    agg.set(key, (agg.get(key) ?? 0) + 1);
  }
  return [...agg.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, value]) => ({
      label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString(locale === "ar" ? "ar" : "en", { month: "short", timeZone: "UTC" }),
      value,
    }));
}

export default async function Field() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");  // ERR-AUTH-001: never proceed with a null session

  // M02-016 expiry is owned by pg_cron sweep expire_lapsed_visits_scheduled
    // (0025, every 15 min, unscoped); boards render display-level 'expired' for
    // lapsed windows in between ticks. No per-page-load mutating RPC (K-009).

  const [assignmentRead, notificationRead] = await Promise.all([
    sb.from("assignments")
      .select("visit_id, status, visits(id, visit_type, execution_mode, planning_status, window_start, window_end, factories(name, factory_code, city, official_lat, official_lng), inspections(id, status, reviews(status, decided_at), submission_versions(submitted_at)))")
      .eq("inspector_id", user.id).order("created_at", { ascending: false }),
    // M03-001 — inspector inbox: own rows only (RLS notif_own is the authority)
    sb.from("notifications")
      .select("id, event_key, payload, delivery_state, created_at")
      .eq("recipient", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  if (assignmentRead.error || notificationRead.error) {
    console.error("[field dashboard reads]", assignmentRead.error?.message ?? notificationRead.error?.message);
    return (
      <Shell current="/field" title={t("field.dashboard.title", "Field dashboard")}>
        <div className="ax-banner ax-banner--critical" role="alert">{t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}</div>
      </Shell>
    );
  }
  const asg = assignmentRead.data;
  const notifRows = notificationRead.data;

  const cards = (asg ?? [])
    .map(a => a.visits as unknown as VisitCard)
    .filter((v): v is NonNullable<typeof v> => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status));

  // ---- KPI + chart aggregates (all from the inspector's own RLS-scoped rows) ----
  const completed = cards.filter(v => v.inspections?.status === "approved").length;
  const awaiting = cards.filter(v => ["submitted", "under_review"].includes(v.inspections?.status ?? "")).length;
  const decided = cards.flatMap(v => v.inspections?.reviews ?? []).filter(r => r.decided_at);
  const approvedReviews = decided.filter(r => r.status === "approved").length;
  const returnedReviews = decided.filter(r => r.status === "returned").length;
  const rejectedReviews = decided.filter(r => r.status === "rejected").length;
  const compliance = decided.length ? `${Math.round((approvedReviews / decided.length) * 100)}%` : "—";

  const visitsByMonth = byMonth(cards.map(v => v.window_start), locale);
  const submissionsByMonth = byMonth(
    cards.flatMap(v => v.inspections?.submission_versions ?? []).map(s => s.submitted_at),
    locale,
  );

  const noData = t("field.dashboard.noData", "No data yet");
  const kpis: [string, string | number][] = [
    [t("field.dashboard.kpi.assigned", "Assigned visits"), cards.length],
    [t("field.dashboard.kpi.completed", "Completed"), completed],
    [t("field.dashboard.kpi.awaitingReview", "Awaiting review"), awaiting],
    [t("field.dashboard.kpi.compliance", "Compliance rate"), compliance],
  ];

  // Center FAB target: the next visit that still needs its startup flow.
  const nextActionable = cards.find(v => v.planning_status !== "expired" && (!v.inspections || v.inspections.status === "not_started"));
  const fabHref = nextActionable ? `/field/${nextActionable.id}` : "/field#visits";

  // ---- FieldHome props (M03-001/003/004/015) — strings-prop canon ----
  const visits: FieldVisit[] = cards.map(v => ({
    id: v.id,
    visitType: v.visit_type,
    executionMode: v.execution_mode,
    planningStatus: v.planning_status,
    windowStart: v.window_start,
    windowEnd: v.window_end,
    factoryName: v.factories!.name,
    factoryCode: v.factories!.factory_code ?? "",
    city: v.factories!.city ?? "",
    lat: v.factories!.official_lat,
    lng: v.factories!.official_lng,
    inspectionId: v.inspections?.id ?? null,
    inspectionStatus: v.inspections?.status ?? null,
  }));

  // Known event_key → translated inbox label; unknown keys humanize as data.
  const notifLabels: Record<string, string> = {
    assignment: t("field.home.notif.assignment", "New visit assigned"),
    visit_cancelled: t("field.home.notif.visitCancelled", "Visit cancelled"),
  };
  const notifications: FieldNotification[] = (notifRows ?? []).map(n => {
    const payload = (n.payload ?? {}) as Record<string, unknown>;
    const detail = [payload.reason, payload.factory, payload.visit_id].find(x => typeof x === "string" && x) as string | undefined;
    return {
      id: n.id as string,
      label: notifLabels[n.event_key as string] ?? String(n.event_key).replace(/_/g, " "),
      detail: detail ?? "",
      createdAt: n.created_at as string,
      unread: n.delivery_state === "queued",
    };
  });

  const homeStrings: FieldHomeStrings = {
    heading: t("field.dashboard.myVisits", "My visits"),
    viewList: t("field.home.view.list", "List"),
    viewCalendar: t("field.home.view.calendar", "Calendar"),
    viewMap: t("field.home.view.map", "Map"),
    viewSwitchAria: t("field.home.view.switchAria", "Switch visits view"),
    searchPlaceholder: t("field.home.search.placeholder", "Search factory or code…"),
    searchAria: t("field.home.search.aria", "Search visits"),
    allStatuses: t("field.home.filter.allStatuses", "All statuses"),
    allTypes: t("field.home.filter.allTypes", "All types"),
    allModes: t("field.home.filter.allModes", "All modes"),
    sortAria: t("field.home.sort.aria", "Sort by visit window"),
    sortEarliest: t("field.home.sort.earliest", "Earliest first"),
    sortLatest: t("field.home.sort.latest", "Latest first"),
    emptyTitle: t("field.dashboard.empty.title", "No assigned visits"),
    emptyBody: t("field.dashboard.empty.body", "Only your own assignments appear here (RBAC-009). New assignments arrive with a notification."),
    noMatch: t("field.home.noMatch", "No visits match the current search and filters."),
    mapEmpty: t("field.home.mapEmpty", "No official coordinates on these factories yet (GIS Admin owns the pins)."),
    // FNS-010 — selected-task highlight. "Details" term: register VR-088 (تفاصيل).
    // selectAria / openDetailsAria are a11y labels with no register row — draft keys.
    selectAria: t("field.home.selectAria", "Select visit: {name}"),
    openDetails: t("field.home.openDetails", "Details"),
    openDetailsAria: t("field.home.openDetailsAria", "Open details for {name}"),
    // FNS-011 — pagination. prev/next terms: register VR-002 / VR-001 (السابق / التالي).
    // paginationPageAria is a nav a11y label with no register row — draft key.
    paginationPrev: t("field.home.pagination.prev", "Previous"),
    paginationNext: t("field.home.pagination.next", "Next"),
    paginationPageAria: t("field.home.pagination.pageAria", "Visit list, page {page} of {count}"),
    windowEnds: t("field.home.windowEnds", "Window ended {date}"),
    statusLabels: {
      prepared: t("field.home.status.prepared", "prepared"),
      not_started: t("field.home.status.notStarted", "not started"),
      in_progress: t("field.home.status.inProgress", "in progress"),
      submitted: t("field.home.status.submitted", "submitted"),
      under_review: t("field.home.status.underReview", "under review"),
      approved: t("field.home.status.approved", "approved"),
      returned: t("field.home.status.returned", "returned"),
      rejected: t("field.home.status.rejected", "rejected"),
      expired: t("field.home.status.expired", "expired"),
      overdue: t("field.home.status.overdue", "overdue"),
    },
    inboxTitle: t("field.home.inbox.title", "Notifications"),
    inboxEmpty: t("field.home.inbox.empty", "Nothing new — assignment and planning updates land here."),
    markRead: t("field.home.inbox.markRead", "Mark read"),
    unreadBadge: t("field.home.inbox.unread", "unread"),
    rescheduleHint: t("field.home.reschedule.hint", "Drag to another day to request a reschedule"),
    rescheduleSent: t("field.home.reschedule.sent", "Reschedule request sent to the planner; the visit stays unchanged until approved."),
    rescheduleFailed: t("field.home.reschedule.failed", "Reschedule request could not be sent; the visit stays unchanged."),
  };

  const headingStyle: React.CSSProperties = { font: "var(--ax-text-heading)", margin: 0 };
  const panelStyle: React.CSSProperties = {
    padding: "var(--ax-space-300)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--ax-space-200)",
  };

  return (
    <Shell current="/field" title={t("field.assignments.title", "My assignments")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("field.assignments.context", "Assigned to you")}</span>}>
      {/* padding-block-end keeps content clear of the fixed bottom tab bar */}
      <div className="ax-field-page">
        <ContextualAiPanel
          surface="inspector_daily_briefing"
          title={t("field.dashboard.ai.title", "My daily inspection briefing")}
          description={t("field.dashboard.ai.description", "A short advisory summary of your recorded assignments. It does not create a route, alter a visit, or change your priorities.")}
          context={JSON.stringify({ inspector_id: user.id })}
          evidenceRefs={["MVP1-M03-001", "MVP1-M03-003", "MVP1-M03-009", "SCR-IPAD-600"]}
          generateLabel={t("field.dashboard.ai.generate", "Generate my briefing")}
          unavailableLabel={t("field.dashboard.ai.unavailable", "AI briefing unavailable — nothing was generated or changed.")}
          evidenceLabel={t("field.dashboard.ai.evidence", "Source references")}
          advisoryLabel={t("field.dashboard.ai.advisory", "Advisory only · human decides")}
          reviewLabel={t("field.dashboard.ai.review", "Review or reject this advisory")}
        />
        {/* M03-001/003/004/015 — inbox + Calendar/List/Map + search/filter/sort + expiry display */}
        <FieldHome visits={visits} notifications={notifications} strings={homeStrings}
          nowIso={new Date().toISOString()} locale={locale} />

        <details className="ax-field-performance">
          <summary>{t("field.dashboard.performanceOverview", "Performance overview")}</summary>
          <div className="ax-field-performance__body">
            <div className="ax-kpi-row">
              {kpis.map(([label, value]) => (
                <div key={label} className="ax-surface ax-kpi">
                  <span className="ax-caption">{label}</span>
                  <span className="ax-kpi__value ax-numeric">{value}</span>
                </div>
              ))}
            </div>

            <div className="ax-field-performance__charts">
              <section className="ax-surface ax-panel" style={panelStyle}>
                <h3 style={headingStyle}>{t("field.dashboard.visitsByMonth", "Visits by month")}</h3>
                <BarChart data={visitsByMonth} title={t("field.dashboard.visitsByMonth", "Visits by month")} emptyLabel={noData} />
              </section>
              <section className="ax-surface ax-panel" style={panelStyle}>
                <h3 style={headingStyle}>{t("field.dashboard.reviewOutcomes", "Review outcomes")}</h3>
                <DonutChart
                  data={[
                    { label: t("field.dashboard.approved", "Approved"), value: approvedReviews, tone: "success" },
                    { label: t("field.dashboard.returned", "Returned"), value: returnedReviews, tone: "warning" },
                    { label: t("field.dashboard.rejected", "Rejected"), value: rejectedReviews, tone: "critical" },
                  ]}
                  title={t("field.dashboard.reviewOutcomes", "Review outcomes")}
                  centerLabel={t("field.dashboard.decided", "decided")}
                  emptyLabel={noData}
                />
              </section>
              <section className="ax-surface ax-panel" style={panelStyle}>
                <h3 style={headingStyle}>{t("field.dashboard.submissionsTrend", "Submissions trend")}</h3>
                <LineChart data={submissionsByMonth} title={t("field.dashboard.submissionsTrend", "Submissions trend")} emptyLabel={noData} />
              </section>
            </div>
          </div>
        </details>
      </div>

      <FieldTabs active="dashboard" fabHref={fabHref} labels={{
        dashboard: t("field.tabs.dashboard", "Dashboard"),
        visits: t("field.tabs.visits", "Visits"),
        virtual: t("field.tabs.virtual", "Virtual"),
        fab: t("field.tabs.startNext", "Start next visit"),
      }} />
    </Shell>
  );
}
