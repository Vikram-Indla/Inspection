import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import { supabaseServer } from "@/lib/supabase-server";
import OperationsTimeline from "@/components/operations/operations-timeline/operations-timeline";
import OperationsHistoryTable, { type HistoryRow } from "@/components/operations/operations-history-table/operations-history-table";
import type { TimelineEvent } from "@/components/saqeel/timeline/timeline";
import type { OperationsScope } from "@/features/operations/scope";
import type { OperationsModel } from "./model";
import { makeLabelers } from "./labels";

type OperationsTimelineRow = {
  event_key: string;
  occurred_at: string;
  object_type: string;
  object_id: string;
  payload: Record<string, unknown>;
};

export default async function TimelineHistorySection({ model, scope }: {
  model: OperationsModel;
  scope: OperationsScope;
}) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const localeTag = locale === "ar" ? "ar" : "en";
  const timelineVisitId = model.monitored.some(visit => visit.id === scope.timelineVisit)
    ? scope.timelineVisit
    : null;
  const sb = await supabaseServer();
  const timelineRpc = timelineVisitId
    ? await sb.rpc("operations_visit_timeline", { p_visit_id: timelineVisitId })
    : { data: [] as OperationsTimelineRow[], error: null };
  if (timelineRpc.error) console.error(`[operations] timeline read failed: ${timelineRpc.error.message}`);
  const operationsTimeline: OperationsTimelineRow[] = timelineRpc.data ?? [];
  return (
    <>
      <OperationsTimeline
        options={model.monitored.map(visit => ({
          value: visit.id,
          label: `${visit.factories?.name ?? visit.id.slice(0, 8)} · ${visit.id.slice(0, 8)}`,
        }))}
        selected={timelineVisitId ?? ""}
        scope={{
          ...(scope.view === "performance" ? { view: "performance" } : {}),
          ...(scope.region ? { region: scope.region } : {}),
          ...(scope.city ? { city: scope.city } : {}),
        }}
        events={operationsTimeline.map<TimelineEvent>(event => ({
          id: `${event.object_type}:${event.object_id}:${event.event_key}`,
          dateTime: event.occurred_at,
          time: formatDateTime(event.occurred_at, localeTag),
          title: lab.enumLabel(event.event_key),
          meta: event.object_type,
          detail: <code>{JSON.stringify(event.payload)}</code>,
        }))}
        unavailable={Boolean(timelineRpc.error)}
        strings={{
          title: t("ops.timeline.heading", "Visit timeline"),
          description: t("ops.timeline.body", "The full order of events, from planning through inspection, review and handoff to Compliance."),
          label: t("ops.timeline.choose", "Choose a visit timeline"),
          placeholder: t("ops.timeline.selectPlaceholder", "Select visit"),
          load: t("ops.timeline.load", "Load timeline"),
          selectPrompt: t("ops.timeline.select", "Select a visit to load its timeline"),
          unavailableTitle: t("ops.timeline.unavailable", "Visit timeline unavailable"),
          unavailableBody: t("ops.err.retry", "Retry"),
          emptyTitle: t("ops.timeline.empty", "No authorized timeline events for this visit"),
        }}
      />
      <OperationsHistoryTable
        rows={model.geoHistoryRows.map<HistoryRow>(event => ({
          id: event.id,
          occurredAt: formatDateTime(event.occurred_at, localeTag),
          occurredAtIso: event.occurred_at,
          visitHref: `/visits/${event.visit_id}`,
          visitLabel: event.visit_id.slice(0, 8),
          event: lab.enumLabel(event.kind),
          geofence: event.geofence_result ? lab.enumLabel(event.geofence_result) : "—",
          position: Number.isFinite(Number(event.observed_lat)) && Number.isFinite(Number(event.observed_lng))
            ? `${Number(event.observed_lat).toFixed(6)}, ${Number(event.observed_lng).toFixed(6)}`
            : "—",
        }))}
        strings={{
          title: t("ops.history.heading", "Location and visit status history"),
          description: t("ops.history.body", "The last 100 events from the location history log you can see. These records are never changed here."),
          time: t("ops.history.time", "Recorded at"),
          visit: t("ops.live.th.visit", "Visit"),
          event: t("ops.history.event", "Event"),
          geofence: t("ops.live.th.geofence", "Geofence"),
          position: t("ops.history.position", "Recorded position"),
          emptyTitle: t("ops.history.empty", "No recorded location history in this scope"),
        }}
      />
    </>
  );
}
