import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import CalendarBoard, { type CalVisit, type CalendarStrings } from "./CalendarBoard";
import VisitViewNavigation, { type VisitBasePath } from "../VisitViewNavigation";

// FIX WAVE F4 — M02-038: Day/Week/Month calendar in web Visit Management
// (previously only the iPad field home had a calendar). RLS-scoped read;
// expired states persisted before render (M02-016 parity with /visits).

type Joined = {
  id: string; visit_type: string; planning_status: string; operational_state: string;
  window_start: string; window_end: string;
  factories: { name: string } | null;
};

export async function VisitsCalendarView({ basePath = "/visits" }: { basePath?: VisitBasePath }) {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  // M02-016 expiry is owned by pg_cron sweep expire_lapsed_visits_scheduled
  // (0025, every 15 min, unscoped); boards render display-level 'expired' for
  // lapsed windows in between ticks. No per-page-load mutating RPC (K-009).
  const { data, error } = await sb.from("visits")
    .select("id, visit_type, planning_status, operational_state, window_start, window_end, factories(name)")
    .order("window_start", { ascending: true })
    .limit(1000);
  if (error) {
    // CD-026 query-degraded — neutralise provider error (log server-side only).
    console.error(`[visits.calendar] load failed: ${error.message}`);
    return (
      <Shell current={basePath} title={t("visit.cal.title", "Visit calendar")}>
        <div className="sq-banner sq-banner--critical" role="alert"><div>{t("visit.list.loadErrorNeutral", "Visits are temporarily unavailable. Please try again.")}</div></div>
      </Shell>
    );
  }
  const visits: CalVisit[] = ((data ?? []) as unknown as Joined[]).map(v => ({
    id: v.id,
    windowStart: v.window_start,
    windowEnd: v.window_end,
    factoryName: v.factories?.name ?? "—",
    planningStatus: v.planning_status,
    planningLabel: t(`enum.${v.planning_status}`, v.planning_status),
    opsLabel: t(`enum.${v.operational_state}`, v.operational_state.replace(/_/g, " ")),
    typeLabel: t(`enum.${v.visit_type}`, v.visit_type),
  }));
  const strings: CalendarStrings = {
    viewDay: t("visit.cal.viewDay", "Day"),
    viewWeek: t("visit.cal.viewWeek", "Week"),
    viewMonth: t("visit.cal.viewMonth", "Month"),
    viewSwitchAria: t("visit.cal.viewSwitchAria", "Calendar view"),
    prev: t("visit.cal.prev", "Previous"),
    next: t("visit.cal.next", "Next"),
    today: t("visit.cal.today", "Today"),
    emptyRange: t("visit.cal.emptyRange", "No visits in this range."),
    moreCount: t("visit.cal.moreCount", "+{n} more"),
    visitsOn: t("visit.cal.visitsOn", "{n} visits — placed by window start; click to open the visit"),
  };
  return (
    <Shell current={basePath} title={t("visit.cal.title", "Visit calendar")}
      context={<span className="sq-lozenge sq-lozenge--info">{t("visit.cal.context", "Filtered to your access")}</span>}>
      <VisitViewNavigation basePath={basePath} active="calendar" ariaLabel={t("visit.views.aria", "Visit management views")}
        labels={{ list: basePath === "/planning" ? t("plan.home.title", "Planning") : t("visit.views.list", "List"), calendar: t("visit.views.calendar", "Calendar"), map: t("visit.views.map", "Map"), workload: t("visit.views.workload", "Workload") }} />
      <CalendarBoard visits={visits} locale={locale} strings={strings} />
    </Shell>
  );
}
