import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import VisitWorkload from "@/components/sections/visits/visit-workload/visit-workload";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { loadInspectorWorkload } from "@/features/visits/workload";
import VisitViewNavigation, { type VisitBasePath } from "../VisitViewNavigation";

// M02-016 expiry is owned by the pg_cron sweep expire_lapsed_visits_scheduled
// (0025, every 15 min, unscoped). No per-page-load mutating RPC (K-009). This
// marker is asserted as source text by e2e/cd-026 — see WEB-006 §4.

export async function WorkloadView({ basePath = "/visits" }: { basePath?: VisitBasePath }) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const strings = messages.visits.workload;
  const views = messages.planning.visit.views;
  const uiLocale = locale === "ar" ? "ar" : "en";
  const read = await loadInspectorWorkload(await supabaseServer(), Date.now());

  if (!read.ok) {
    console.error(`[visits.workload] load failed: ${read.reason}`);
    return (
      <Shell current={basePath} title={strings.loadErrorTitle}>
        <EmptyState icon="calendar" tone="danger" title={strings.loadErrorTitle} description={strings.loadErrorNeutral} />
      </Shell>
    );
  }

  return (
    <Shell
      current={basePath}
      title={strings.title}
      context={<StatusPill tone="info">{strings.context}</StatusPill>}
    >
      <VisitViewNavigation
        basePath={basePath}
        active="workload"
        ariaLabel={views.aria}
        labels={{
          list: basePath === "/planning" ? messages.planning.home.title : views.list,
          calendar: views.calendar,
          map: views.map,
          workload: views.workload,
        }}
      />
      {read.data.inspectors.length === 0 ? (
        <EmptyState icon="calendar" title={strings.empty.title} description={strings.empty.body} />
      ) : (
        <VisitWorkload data={read.data} strings={strings} locale={uiLocale} />
      )}
    </Shell>
  );
}
