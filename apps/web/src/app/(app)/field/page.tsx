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
import FieldSyncChips from "@/components/field/FieldSyncChips";
import FieldConnectivityBanner from "@/components/field/FieldConnectivityBanner";
import FieldDraftList from "@/components/field/FieldDraftList";
import PreInspectionPackSheet, { type PackData } from "@/components/field/PreInspectionPackSheet";
import {
  buildInspectorKpiProjection,
  findMetric,
  countChecklistCompliance,
  type InspectorProjectionInput,
} from "@/lib/dashboard-kpi";
import { buildInspectorWeeklyKpi } from "@/lib/dashboard-kpi/inspector-weekly";
import { resolveDashboardPolicyVersion } from "@/lib/dashboard-kpi/loader";
import { buildGovernedMetricTile, buildPlainMetricTile, type BlockedTexts } from "@/lib/field-metric-tile";
import { getOrGenerateBriefing } from "@/lib/ai/briefing";
import { FieldScopeProvider } from "@/components/field/FieldScopeProvider";
import FieldScopeToggle from "@/components/field/FieldScopeToggle";
import FieldMetricStrip from "@/components/field/FieldMetricStrip";
import DailyBriefingCard from "@/components/field/DailyBriefingCard";
import styles from "./field-dashboard.module.css";
import { isNotificationUnread } from "@/lib/notification-read";

// visits -> inspections is TO-ONE (object | null, NOT array) — do not regress.
// inspections -> reviews / submission_versions are TO-MANY (arrays).
type Review = { status: string; decision: string | null; decided_at: string | null };
type Inspection = {
  id: string;
  status: string;
  submitted_at: string | null;
  package_version_id: string | null;
  reviews: Review[] | null;
  submission_versions: { submitted_at: string }[] | null;
};
type VisitCard = {
  id: string;
  visit_type: string;
  execution_mode: string;
  planning_status: string;
  operational_state: string;
  window_start: string;
  window_end: string;
  factories: {
    id: string;
    name: string;
    factory_code: string;
    city: string;
    cr_number: string | null;
    official_lat: number | null;
    official_lng: number | null;
    risk_band: string | null;
    risk_score: number | null;
    risk_drivers: unknown;
  } | null;
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

  const [assignmentRead, notificationRead, policy, dailyBriefing, weeklyBriefing] = await Promise.all([
    sb.from("assignments")
      .select("visit_id, status, visits(id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end, factories(id, name, factory_code, city, cr_number, official_lat, official_lng, risk_band, risk_score, risk_drivers), inspections(id, status, submitted_at, package_version_id, reviews(status, decision, decided_at), submission_versions(submitted_at)))")
      .eq("inspector_id", user.id).order("created_at", { ascending: false }),
    // M03-001 — inspector inbox: own rows only (RLS notif_own is the authority)
    sb.from("notifications")
      .select("id, event_key, payload, delivery_state, read_at, created_at")
      .eq("recipient", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    // Shared KPI: the effective published dashboard policy version (or null).
    resolveDashboardPolicyVersion(sb),
    // TASK-FIELD-BRIEFING-AUTOLOAD-001 — auto-fetch, cached once/Riyadh-day;
    // no manual "Generate" click needed for the briefing to already be there.
    getOrGenerateBriefing("daily"),
    getOrGenerateBriefing("weekly"),
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

  // Excludes only the golden-journey e2e fixture (apps/web/e2e/golden-journey.spec.ts
  // creates a throwaway factory per run: factory_code `G10-JOURNEY-<ts>`, name
  // `G10 Golden Journey G10-JOURNEY-<ts>`). This is a human-facing display filter
  // only — the fixture itself, its migrations, and the spec are untouched, and the
  // spec authenticates as its own throwaway inspector (a different inspector_id),
  // never asserting this list's contents, so this filter cannot affect the test.
  const isGoldenJourneyFixture = (v: VisitCard) =>
    /^G10-JOURNEY-/.test(v.factories?.factory_code ?? "") || /^G10 Golden Journey /.test(v.factories?.name ?? "");

  const cards = (asg ?? [])
    .map(a => a.visits as unknown as VisitCard)
    .filter((v): v is NonNullable<typeof v> => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter(v => !isGoldenJourneyFixture(v));

  // ---- Checklist responses for the inspector's own inspections (RLS-scoped) --
  // Fed to the SHARED projection for the correct compliance metric — never a
  // local iPad formula. inspection_id lets the pack scope compliance per visit.
  const inspectionIds = cards.map(v => v.inspections?.id).filter((x): x is string => !!x);
  let responseRows: { inspection_id: string; is_complete: boolean; response: { value?: string | null } | null }[] = [];
  if (inspectionIds.length > 0) {
    const respRead = await sb.from("checklist_responses")
      .select("inspection_id, is_complete, response")
      .in("inspection_id", inspectionIds);
    if (respRead.error) console.error("[field dashboard responses]", respRead.error.message);
    else responseRows = (respRead.data ?? []) as typeof responseRows;
  }

  // ---- SHARED inspector KPI projection (P0 fix lives entirely server-side) ----
  const nowMs = Date.now();
  const projectionInput: InspectorProjectionInput = {
    visits: cards.map(v => ({ id: v.id, window_start: v.window_start, operational_state: v.operational_state })),
    inspections: cards
      .filter(v => v.inspections)
      .map(v => ({ id: v.inspections!.id, visit_id: v.id, status: v.inspections!.status, submitted_at: v.inspections!.submitted_at })),
    reviews: cards.flatMap(v => (v.inspections?.reviews ?? []).map(r => ({
      inspection_id: v.inspections!.id, status: r.status, decision: r.decision, decided_at: r.decided_at,
    }))),
    responses: responseRows.map(r => ({ is_complete: r.is_complete, response: r.response })),
    syncQueueCount: 0,               // device queue is surfaced live by FieldSyncChips (client); not merged server-side
    nowMs,
    policyVersionId: policy.policyVersionId,
    refreshedAt: new Date(nowMs).toISOString(),
    sourceStatus: "live",
  };
  const projection = buildInspectorKpiProjection(projectionInput);
  const mToday = findMetric(projection, "IPAD-KPI-001");
  const mRemaining = findMetric(projection, "IPAD-KPI-002");
  const mAttention = findMetric(projection, "IPAD-KPI-003");
  const mProgress = findMetric(projection, "IPAD-KPI-004");
  const mApproval = findMetric(projection, "IPAD-KPI-005");
  const mCompliance = findMetric(projection, "IPAD-KPI-006");

  // TASK-FIELD-KPI-WEEKLY-001 — same rows, same formulas, 7-day window.
  const weeklyKpi = buildInspectorWeeklyKpi({
    visits: projectionInput.visits,
    inspections: projectionInput.inspections,
    reviews: projectionInput.reviews,
    nowMs,
  });

  // Status-rail buckets, derived for DISPLAY from governed rows (not new KPIs).
  const returnedCount = cards.filter(v => v.inspections?.status === "returned"
    || (v.inspections?.reviews ?? []).some(r => r.status === "returned")).length;
  const draftCount = cards.filter(v => v.inspections?.status === "in_progress").length;

  // Approval outcomes: present the governed decision mix + its approve rate,
  // both taken straight from the shared metric breakdown (no new arithmetic).
  const approvalBreak = Object.fromEntries((mApproval?.breakdown ?? []).map(b => [b.labelRef, b.value]));
  const approveN = approvalBreak.approve ?? 0;
  const decidedN = (mApproval?.value ?? 0);
  const approvalRate = decidedN > 0 ? Math.round((approveN / decidedN) * 100) : null;

  const noData = t("field.dashboard.noData", "No data yet");

  // Legacy performance charts (PRESERVED). Review outcomes is correctly named as
  // decision outcomes — it is NOT compliance and is kept separate.
  const decided = cards.flatMap(v => v.inspections?.reviews ?? []).filter(r => r.decided_at);
  const approvedReviews = decided.filter(r => r.status === "approved").length;
  const returnedReviews = decided.filter(r => r.status === "returned").length;
  const rejectedReviews = decided.filter(r => r.status === "rejected").length;
  const visitsByMonth = byMonth(cards.map(v => v.window_start), locale);
  const submissionsByMonth = byMonth(
    cards.flatMap(v => v.inspections?.submission_versions ?? []).map(s => s.submitted_at),
    locale,
  );

  // Selected/next visit — the next that still needs its startup flow, else the
  // earliest non-expired assignment (so the preparation pane is never empty).
  const nextActionable = cards.find(v => v.planning_status !== "expired" && (!v.inspections || v.inspections.status === "not_started"));
  const selected = nextActionable
    ?? [...cards].filter(v => v.planning_status !== "expired").sort((a, b) => a.window_start.localeCompare(b.window_start))[0]
    ?? null;
  // Resume vs start-next href for the action bar / selected pane.
  const selectedHref = selected
    ? (selected.inspections && selected.inspections.status !== "not_started"
        ? `/field/inspection/${selected.inspections.id}`
        : `/field/${selected.id}`)
    : "/field#visits";

  // ---- FieldHome props (M03-001/003/004/015) — strings-prop canon (PRESERVED) ----
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
      unread: isNotificationUnread({
        read_at: n.read_at as string | null,
        delivery_state: n.delivery_state as string,
      }),
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
    selectAria: t("field.home.selectAria", "Select visit: {name}"),
    openDetails: t("field.home.openDetails", "Details"),
    openDetailsAria: t("field.home.openDetailsAria", "Open details for {name}"),
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

  // ---- Pre-Inspection Pack data (governed; honest unavailable states) --------
  const packUnavailableHealth = t("field.pack.health.unavailable", "No governed Health Score source yet (DEC-DASH-002). Health and Risk are separate engines.");
  const packUnavailableRepeat = t("field.pack.repeat.unavailable", "Repeat-finding lineage is not available in a governed source yet (DEC-DASH-011).");
  const packUnavailableLicence = t("field.pack.licence.unavailable", "Licence facts are not available in a governed source yet (DEC-DASH-005).");
  let packData: PackData | null = null;
  if (selected && selected.factories) {
    const f = selected.factories;
    const insp = selected.inspections;
    // Package label for the locked package (best-effort governed lookup).
    let packageLabel: string | null = null;
    let packageStatus: string | null = null;
    if (insp?.package_version_id) {
      const pv = await sb.from("package_versions")
        .select("version_label, status, packages(title, code)")
        .eq("id", insp.package_version_id).maybeSingle();
      if (!pv.error && pv.data) {
        const pkg = (pv.data.packages as unknown as { title?: string; code?: string } | null);
        packageLabel = [pkg?.title ?? pkg?.code, pv.data.version_label].filter(Boolean).join(" ") || pv.data.version_label;
        packageStatus = pv.data.status ?? null;
      }
    }
    // Previous approved inspection for this factory (best-effort, RLS-scoped).
    let previousApproved: string | null = null;
    const prev = await sb.from("inspections")
      .select("submitted_at, visits!inner(factory_id)")
      .eq("status", "approved")
      .eq("visits.factory_id", f.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!prev.error && prev.data?.submitted_at) {
      previousApproved = t("field.pack.previous.value", "Approved {date}").replace(
        "{date}", new Date(prev.data.submitted_at as string).toLocaleDateString(locale === "ar" ? "ar" : "en", { day: "numeric", month: "short", year: "numeric" }));
    }
    // Compliance for the selected inspection only (shared function, no new math).
    let compliance: PackData["compliance"] = null;
    if (insp) {
      const rows = responseRows.filter(r => r.inspection_id === insp.id);
      if (rows.length) {
        const c = countChecklistCompliance(rows.map(r => ({ is_complete: r.is_complete, response: r.response })));
        compliance = { rate: c.rate, compliant: c.compliant, eligible: c.eligible };
      }
    }
    const drivers = Array.isArray(f.risk_drivers)
      ? (f.risk_drivers as unknown[]).map(String).slice(0, 4)
      : (f.risk_drivers && typeof f.risk_drivers === "object" ? Object.keys(f.risk_drivers as object).slice(0, 4) : null);

    packData = {
      visitId: selected.id,
      inspectionId: insp?.id ?? null,
      visitRef: selected.id.slice(0, 8),
      factoryName: f.name,
      packPolicyVersion: policy.policyVersionId,
      packageLabel,
      packageStatus,
      crNumber: f.cr_number,
      officialLocation: (f.official_lat != null && f.official_lng != null) ? `${f.official_lat.toFixed(4)}, ${f.official_lng.toFixed(4)}` : null,
      licence: { value: null, unavailable: packUnavailableLicence },
      riskBand: f.risk_band,
      riskScore: f.risk_score,
      riskDrivers: drivers,
      health: { value: null, unavailable: packUnavailableHealth },
      previousApproved,
      returnedContext: returnedCount > 0 ? t("field.pack.returned.context", "Returned/rejected context is shown separately from approvals.") : null,
      compliance,
      repeatFindings: { value: null, unavailable: packUnavailableRepeat },
      freshnessMinutes: 0,
    };
  }

  const riyadhDate = new Date(nowMs).toLocaleDateString(locale === "ar" ? "ar" : "en", {
    weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh",
  });

  // Metric-strip tiles: honest render of a shared metric (never fabricate a
  // value); daily uses the governed SharedMetric blocked-state machinery,
  // weekly is a plain always-available mirror of the same formula.
  const blockedTexts: BlockedTexts = {
    notConfigured: t("field.metric.notConfigured", "Not configured"),
    decisionRequired: t("field.metric.decisionRequired", "Decision required"),
    unavailable: t("field.metric.unavailable", "Unavailable"),
    na: t("field.metric.na", "N/A"),
  };
  const dailyTiles = [
    buildGovernedMetricTile(t("field.metric.today", "Today's visits"), mToday, t("field.metric.today.delta", "assigned · window begins today"), blockedTexts),
    buildGovernedMetricTile(t("field.metric.remaining", "Remaining"), mRemaining, t("field.metric.remaining.delta", "assigned − submitted"), blockedTexts),
    buildGovernedMetricTile(t("field.metric.attention", "Pending attention"), mAttention, t("field.metric.attention.delta", "returned + draft"), blockedTexts, { warn: (mAttention?.value ?? 0) > 0 }),
    buildGovernedMetricTile(t("field.metric.progress", "Daily progress"), mProgress, t("field.metric.progress.delta", "submitted ÷ assigned · not approval"), blockedTexts, { percent: true }),
  ];
  const weeklyTiles = [
    buildPlainMetricTile(t("field.metric.week.visits", "This week's visits"), weeklyKpi.visitsThisWeek, t("field.metric.week.visits.delta", "assigned · past 7 days"), blockedTexts),
    buildPlainMetricTile(t("field.metric.week.remaining", "Remaining this week"), weeklyKpi.remainingThisWeek, t("field.metric.remaining.delta", "assigned − submitted"), blockedTexts),
    buildPlainMetricTile(t("field.metric.week.attention", "Pending attention (week)"), weeklyKpi.pendingAttentionThisWeek, t("field.metric.attention.delta", "returned + draft"), blockedTexts, { warn: weeklyKpi.pendingAttentionThisWeek > 0 }),
    buildPlainMetricTile(t("field.metric.week.progress", "Weekly progress"), weeklyKpi.progressPercentThisWeek, t("field.metric.progress.delta", "submitted ÷ assigned · not approval"), blockedTexts, { percent: true }),
  ];

  const riskTone = selected?.factories?.risk_band
    ? (/high|crit/i.test(selected.factories.risk_band) ? "critical" : /med/i.test(selected.factories.risk_band) ? "warning" : "success")
    : "neutral";

  return (
    <Shell current="/field" title={t("field.assignments.title", "My assignments")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("field.assignments.context", "Assigned to you")}</span>}>
      {/* padding-block-end (ax-field-page) keeps content clear of the fixed bottom tab bar */}
      <div className={`ax-field-page ${styles.shell}`}>

        {/* FIELD TOP CONTEXT */}
        <header className={styles.topContext}>
          <div>
            <div className={styles.topContext__title}>{t("field.top.today", "Today")} · {riyadhDate}</div>
            <div className={styles.topContext__meta}>
              Asia/Riyadh · {t("field.top.assigned", "{n} assigned visits").replace("{n}", String(cards.length))}
            </div>
          </div>
          <span className={styles.grow} />
          <FieldSyncChips userId={user.id} strings={{
            offlineQueued: t("field.sync.offlineQueued", "Offline — {n} changes queued"),
            online: t("field.sync.online", "Online"),
            synced: t("field.sync.synced", "All changes synced"),
            syncFailed: t("field.sync.failed", "{n} sync conflict(s) — no data lost"),
          }} />
        </header>
        <FieldConnectivityBanner
          offline={t("field.connectivity.offline", "You are offline — local work will sync when connectivity returns.")}
          weak={t("field.connectivity.weak", "Weak connection detected — syncing may take longer.")}
        />

        {/* PLAN v7 item 7 — field-native establishment and incident entry. */}
        <nav aria-label={t("field.quickActions", "Field tools")} className="ax-surface ax-panel"
          style={{ padding: "var(--ax-space-200)", display: "flex", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
          <a className="ax-btn ax-btn--secondary ax-btn--field" href="/field/establishments">
            {locale === "ar" ? "المنشآت الميدانية" : t("field.establishments.title", "Field establishments")}
          </a>
          <a className="ax-btn ax-btn--secondary ax-btn--field" href="/field/incident-reports">
            {locale === "ar" ? "بلاغات الحوادث" : t("field.incidents.title", "Incident reports")}
          </a>
          <a className="ax-btn ax-btn--secondary ax-btn--field" href="/virtual">
            {locale === "ar" ? "الزيارة الافتراضية" : t("field.tabs.virtual", "Virtual")}
          </a>
        </nav>

        {/* MISSION + STATUS RAIL */}
        <div className={styles.missionRail}>
          <div className={styles.mission}>
            {t("field.mission.remaining", "{n} visits remaining").replace("{n}", String(mRemaining?.value ?? 0))}
            {selected?.factories?.risk_band && (riskTone === "critical" || riskTone === "warning")
              ? ` · ${t("field.mission.nextRisk", "next needs attention")}` : ""}
          </div>
          <span className={styles.grow} />
          {returnedCount > 0 && <span className={`${styles.exc} ${styles["exc--warning"]}`}><span className={styles.exc__mark} />{t("field.rail.returned", "{n} returned inspection").replace("{n}", String(returnedCount))}</span>}
          {draftCount > 0 && (
            <a href="/field/drafts" className={`${styles.exc} ${styles["exc--pending"]}`} style={{ textDecoration: "none" }}>
              <span className={styles.exc__mark} />{t("field.rail.draft", "{n} draft to resume").replace("{n}", String(draftCount))}
            </a>
          )}
        </div>

        {/* Daily/Weekly KPI strip + briefing card share ONE toggle (TASK-FIELD-KPI-WEEKLY-001 /
            TASK-FIELD-BRIEFING-WEEKLY-001) — see FieldScopeProvider for why shared vs separate. */}
        <FieldScopeProvider>
          <div className="ax-row" style={{ justifyContent: "flex-end" }}>
            <FieldScopeToggle strings={{
              daily: t("field.scope.daily", "Daily"),
              weekly: t("field.scope.weekly", "Weekly"),
              aria: t("field.scope.aria", "Switch dashboard scope"),
            }} />
          </div>

          {/* METRIC STRIP — shared inspector projection (P0 semantics); weekly is the
              same formula over the past 7 days (TASK-FIELD-KPI-WEEKLY-001). */}
          <FieldMetricStrip daily={dailyTiles} weekly={weeklyTiles} />

          {/* Redesigned daily/weekly briefing card (TASK-FIELD-BRIEFING-AUTOLOAD-001) —
              already populated on load, cached once/Riyadh-day, no manual Generate click. */}
          <DailyBriefingCard
            daily={dailyBriefing}
            weekly={weeklyBriefing}
            evidenceRefs={["MVP1-M03-001", "MVP1-M03-003", "MVP1-M03-009", "SCR-IPAD-600"]}
            strings={{
              titleDaily: t("field.dashboard.ai.title", "My daily inspection briefing"),
              titleWeekly: t("field.dashboard.ai.titleWeekly", "My weekly inspection briefing"),
              advisory: t("field.dashboard.ai.advisory", "AI-advisory · not a decision"),
              refreshAria: t("field.dashboard.ai.refresh", "Refresh briefing"),
              refreshing: t("field.dashboard.ai.refreshing", "Refreshing…"),
              review: t("field.dashboard.ai.review", "Review or reject this advisory"),
              unavailable: t("field.dashboard.ai.unavailable", "Briefing unavailable — nothing was generated or changed."),
              cachedFrom: t("field.dashboard.ai.cachedFrom", "Generated {time}"),
            }}
          />
        </FieldScopeProvider>

        {/* WORKSPACE: map/list/calendar (PRESERVED FieldHome) + selected-visit pane */}
        <div className={styles.workspace}>
          <div>
            {/* M03-001/003/004/015 — inbox + Calendar/List/Map + search/filter/sort + expiry display */}
            <FieldHome visits={visits} notifications={notifications} strings={homeStrings}
              nowIso={new Date(nowMs).toISOString()} locale={locale} />
          </div>

          <div className={styles.pane}>
            {/* Selected / next visit preparation */}
            {selected && selected.factories ? (
              <section className={`ax-surface ax-panel ${styles.selectedCard} ${riskTone === "warning" ? styles["selectedCard--warning"] : riskTone === "neutral" || riskTone === "success" ? styles["selectedCard--neutral"] : ""}`} style={{ padding: "var(--ax-space-300)" }}>
                <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span className={`ax-lozenge ax-lozenge--${riskTone === "critical" ? "critical" : riskTone === "warning" ? "warning" : "ops"}`}>
                    {selected.factories.risk_band
                      ? t("field.selected.risk", "Risk: {band}").replace("{band}", selected.factories.risk_band)
                      : t("field.selected.riskUnknown", "Risk not scored")}
                  </span>
                  <span className="ax-caption ax-numeric">{selected.id.slice(0, 8)}</span>
                </div>
                <div style={{ font: "var(--ax-text-body-strong)", marginBlockStart: "var(--ax-space-150)" }}>{selected.factories.name}</div>
                <div className="ax-caption">{selected.visit_type} · {selected.execution_mode.replace(/_/g, " ")}{selected.factories.cr_number ? <> · <span className="ax-numeric">CR {selected.factories.cr_number}</span></> : null}</div>
                <dl className={styles.desc} style={{ marginBlockStart: "var(--ax-space-200)" }}>
                  <dt>{t("field.selected.health", "Health Score")}</dt>
                  <dd><em className="ax-caption">{t("field.selected.healthUnavailable", "Not scored (separate engine)")}</em></dd>
                  <dt>{t("field.selected.riskScore", "Risk Score")}</dt>
                  <dd>{selected.factories.risk_band ? `${selected.factories.risk_band}${selected.factories.risk_score != null ? " · " + selected.factories.risk_score : ""}` : "—"}</dd>
                  {packData?.packageLabel && (
                    <>
                      <dt>{t("field.selected.package", "Package")}</dt>
                      <dd><span className="ax-numeric">{packData.packageLabel}</span>{packData.packageStatus ? ` · ${packData.packageStatus}` : ""}</dd>
                    </>
                  )}
                </dl>
                <div className="ax-row" style={{ gap: "var(--ax-space-150)", marginBlockStart: "var(--ax-space-200)", flexWrap: "wrap" }}>
                  {packData && <PreInspectionPackSheet userId={user.id} data={packData} moduleClasses={{ packChipRow: styles.packChipRow, packReadiness: styles.packReadiness, packFooter: styles.packFooter, packBlocked: styles.packBlocked }} strings={{
                    openPack: t("field.pack.open", "Open pre-inspection pack"),
                    title: t("field.pack.title", "Pre-inspection pack"),
                    close: t("field.pack.close", "Close"),
                    cached: t("field.pack.cached", "Cached · offline ready"),
                    freshness: t("field.pack.freshness", "freshness {n} min"),
                    reviewBlocker: t("field.pack.reviewBlocker", "Review — {n} blocker"),
                    ready: t("field.pack.ready", "Ready"),
                    sectionFactory: t("field.pack.section.factory", "Factory, CR & licence"),
                    sectionPackage: t("field.pack.section.package", "Locked package summary"),
                    sectionPrevious: t("field.pack.section.previous", "Previous approved inspection"),
                    sectionRepeat: t("field.pack.section.repeat", "Repeat findings & open actions"),
                    sectionHealthRisk: t("field.pack.section.healthRisk", "Health & Risk drivers"),
                    sectionDocuments: t("field.pack.section.documents", "Documents & evidence"),
                    crNumber: t("field.pack.crNumber", "CR number"),
                    licence: t("field.pack.licence", "Licence"),
                    officialLocation: t("field.pack.officialLocation", "Official location"),
                    provenance: t("field.pack.provenance", "Provenance"),
                    provenanceValue: t("field.pack.provenanceValue", "Official vs observed reconciled on arrival"),
                    distinctConcepts: t("field.pack.distinct", "Distinct governed concepts — Health and Risk are not the same."),
                    documentsNote: t("field.pack.documentsNote", "Official documents and prior inspection evidence are kept in separate custody groups."),
                    healthScore: t("field.pack.healthScore", "Health Score"),
                    riskScore: t("field.pack.riskScore", "Risk Score"),
                    compliance: t("field.pack.compliance", "Compliance — {rate}% compliant · {c}/{e} eligible"),
                    noPrevious: t("field.pack.noPrevious", "No previous approved inspection on record."),
                    startReadiness: t("field.pack.startReadiness", "Start-readiness"),
                    ackPackageCached: t("field.pack.ackPackage", "Package cached for offline"),
                    ackFactory360: t("field.pack.ackFactory360", "Factory 360 snapshot reviewed"),
                    ackRepeatReviewed: t("field.pack.ackRepeat", "I have reviewed repeat findings"),
                    required: t("field.pack.required", "required"),
                    downloadOffline: t("field.pack.download", "Download offline"),
                    checkIn: t("field.pack.checkIn", "Go to check-in"),
                    checkInBlocked: t("field.pack.checkInBlocked", "Check-in — review required"),
                    startupNote: t("field.pack.startupNote", "Opens the governed startup; check-in gates are enforced there."),
                  }} />}
                  <a className="ax-btn ax-btn--subtle" href={`/field/factory-360?factory=${selected.factories.id}&return=${encodeURIComponent("/field")}`}>{t("field.selected.factory360", "Factory 360")}</a>
                </div>
              </section>
            ) : (
              <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }}>
                <p className="ax-caption">{t("field.selected.none", "No upcoming visit selected. Pick one from the list, calendar, or map.")}</p>
              </section>
            )}

            {/* Pending attention (returned / draft resume) */}
            <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
              <div className="ax-overline">{t("field.attention.title", "Pending attention")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
                  {cards.filter(v => v.inspections && (v.inspections.status === "returned" || (v.inspections.reviews ?? []).some(r => r.status === "returned"))).slice(0, 4).map(v => (
                    <div key={`ret-${v.id}`} className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
                      <span className={`${styles.exc} ${styles["exc--warning"]}`}><span className={styles.exc__mark} /></span>
                      <span style={{ flex: 1 }} className="ax-caption">{t("field.attention.returned", "Returned")} · {v.factories!.name}</span>
                      <a className="ax-btn ax-btn--subtle" href={`/field/inspection/${v.inspections!.id}`}>{t("field.attention.resume", "Resume")}</a>
                    </div>
                  ))}
                  <FieldDraftList
                    userId={user.id}
                    serverDrafts={cards.filter(v => v.inspections?.status === "in_progress").map(v => ({
                      inspectionId: v.inspections!.id,
                      factoryName: v.factories!.name,
                    }))}
                    draftLabel={t("field.attention.draft", "Draft")}
                    resumeLabel={t("field.attention.resume", "Resume")}
                    localLabel={t("field.attention.localDraft", "Local inspection draft")}
                    emptyLabel={returnedCount === 0 ? t("field.attention.empty", "Nothing needs attention. Returned inspections and drafts to resume appear here.") : undefined}
                  />
              </div>
            </section>

            {/* Personal performance — Approval outcomes vs Checklist compliance (SEPARATE, P0) */}
            <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
              <div className="ax-overline">{t("field.perf.title", "Personal performance")}</div>
              <div className={styles.perfSplit}>
                <div className={styles.perfSplit__col}>
                  <span className={styles.perfSplit__value}>{approvalRate == null ? t("field.metric.na", "N/A") : `${approvalRate}%`}</span>
                  <span className="ax-caption">{t("field.perf.approval", "Approval outcomes")}</span>
                  <span className="ax-caption ax-numeric" style={{ font: "var(--ax-text-micro)", color: "var(--ax-color-text-secondary)" }}>{t("field.perf.approvalFormula", "approved L2 ÷ decided L2")}</span>
                  <span className="ax-caption ax-numeric">{t("field.perf.mix", "A {a} · R {r} · X {x}").replace("{a}", String(approvalBreak.approve ?? 0)).replace("{r}", String(approvalBreak.return ?? 0)).replace("{x}", String(approvalBreak.reject ?? 0))}</span>
                </div>
                <div className={styles.perfSplit__rule} />
                <div className={styles.perfSplit__col}>
                  <span className={styles.perfSplit__value}>{mCompliance?.value == null ? t("field.metric.na", "N/A") : `${mCompliance.value}%`}</span>
                  <span className="ax-caption">{t("field.perf.compliance", "Checklist compliance")}</span>
                  <span className="ax-caption ax-numeric" style={{ font: "var(--ax-text-micro)", color: "var(--ax-color-text-secondary)" }}>{t("field.perf.complianceFormula", "compliant ÷ (compliant + non)")}</span>
                  <span className="ax-caption ax-numeric">{t("field.perf.complianceDenom", "{c}/{e} eligible").replace("{c}", String(mCompliance?.numerator ?? 0)).replace("{e}", String(mCompliance?.denominator ?? 0))}</span>
                </div>
              </div>
              <span className="ax-caption" style={{ color: "var(--ax-color-text-secondary)" }}>{t("field.perf.distinct", "Distinct metrics — approval is not compliance.")}</span>
            </section>
          </div>
        </div>

        {/* Performance overview + charts (PRESERVED). Review outcomes = decision mix, NOT compliance. */}
        <details className="ax-field-performance">
          <summary>{t("field.dashboard.performanceOverview", "Performance overview")}</summary>
          <div className="ax-field-performance__body">
            <div className="ax-field-performance__charts">
              <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
                <h3 style={{ font: "var(--ax-text-heading)", margin: 0 }}>{t("field.dashboard.visitsByMonth", "Visits by month")}</h3>
                <BarChart data={visitsByMonth} title={t("field.dashboard.visitsByMonth", "Visits by month")} emptyLabel={noData} />
              </section>
              <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
                <h3 style={{ font: "var(--ax-text-heading)", margin: 0 }}>{t("field.dashboard.reviewOutcomes", "Review outcomes")}</h3>
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
              <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
                <h3 style={{ font: "var(--ax-text-heading)", margin: 0 }}>{t("field.dashboard.submissionsTrend", "Submissions trend")}</h3>
                <LineChart data={submissionsByMonth} title={t("field.dashboard.submissionsTrend", "Submissions trend")} emptyLabel={noData} />
              </section>
            </div>
          </div>
        </details>

        {/* FIELD ACTION BAR */}
        <div className={styles.actionBar}>
          <span className={styles.actionBar__meta}>
            {selected?.factories
              ? t("field.action.next", "Next: {name}").replace("{name}", selected.factories.name)
              : t("field.action.noNext", "No next visit")}
          </span>
          <span className={styles.grow} />
          {selected && <a className="ax-btn ax-btn--secondary ax-btn--field" href={`/field/${selected.id}`}>{t("field.action.directions", "Open directions")}</a>}
          <a className="ax-btn ax-btn--prominent ax-btn--field" href={selectedHref}>
            {selected?.inspections && selected.inspections.status !== "not_started"
              ? t("field.action.resume", "Resume")
              : t("field.action.start", "Start journey")}
          </a>
        </div>
      </div>

      <FieldTabs active="home" labels={{
        home: t("field.tabs.dashboard", "Dashboard"),
        myTasks: t("field.tabs.visits", "Visits"),
        establishments: t("field.establishments.title", "Field establishments"),
        notifications: t("field.notifications.title", "Notifications"),
        account: t("field.account.title", "Account"),
      }} />
    </Shell>
  );
}
