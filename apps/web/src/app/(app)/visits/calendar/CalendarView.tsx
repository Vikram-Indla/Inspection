import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import VisitCalendar from "@/components/sections/visits/visit-calendar/visit-calendar";
import { getMessages } from "@/i18n/messages";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { queryVisitCalendar } from "@/features/visits/queries";
import {
  resolveAnchor, resolveView, utcMidnight,
  type CalendarParams, type CalendarVisit,
} from "@/features/visits/calendar";
import VisitViewNavigation, { type VisitBasePath } from "../VisitViewNavigation";

// M02-016 expiry is owned by the pg_cron sweep expire_lapsed_visits_scheduled
// (0025, every 15 min, unscoped); boards render display-level 'expired' for
// lapsed windows in between ticks. No per-page-load mutating RPC (K-009).

export async function VisitsCalendarView({ basePath = "/visits", params = {} }: {
  basePath?: VisitBasePath;
  params?: CalendarParams;
}) {
  const { t, locale } = await useT();
  const messages = getMessages(locale);
  const strings = messages.visits.calendar;
  const uiLocale = locale === "ar" ? "ar" : "en";
  const read = await queryVisitCalendar(await supabaseServer());

  if (!read.ok) {
    console.error(`[visits.calendar] load failed: ${read.reason}`);
    return (
      <Shell current={basePath} title={strings.title}>
        <EmptyState icon="calendar" tone="danger" title={strings.loadErrorTitle} description={strings.loadErrorNeutral} />
      </Shell>
    );
  }

  const visits: readonly CalendarVisit[] = read.rows.map(row => ({
    id: row.id,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    factoryName: row.factories?.name ?? strings.factoryUnavailable,
    planningStatus: row.planning_status,
    planningLabel: t(`enum.${row.planning_status}`, row.planning_status),
    opsLabel: t(`enum.${row.operational_state}`, row.operational_state.replaceAll("_", " ")),
    typeLabel: t(`enum.${row.visit_type}`, row.visit_type),
  }));

  return (
    <Shell current={basePath} title={strings.title} context={<StatusPill tone="info">{strings.context}</StatusPill>}>
      <VisitViewNavigation
        basePath={basePath}
        active="calendar"
        ariaLabel={messages.planning.visit.views.aria}
        labels={{
          list: basePath === "/planning" ? messages.planning.home.title : messages.planning.visit.views.list,
          calendar: messages.planning.visit.views.calendar,
          map: messages.planning.visit.views.map,
          workload: messages.planning.visit.views.workload,
        }}
      />
      <VisitCalendar
        visits={visits}
        view={resolveView(params.view)}
        anchorMs={resolveAnchor(params.on, utcMidnight(new Date()))}
        strings={strings}
        basePath={basePath}
        locale={uiLocale}
      />
    </Shell>
  );
}
