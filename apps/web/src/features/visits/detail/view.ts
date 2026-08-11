import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { ReasonOption } from "@/lib/planning/lifecycle";
import type { VisitDetailData } from "./queries";
import type { LifecycleRow, VisitGeoEvent } from "./types";

export type TimedEntry = {
  readonly id: string;
  readonly dateTime: string;
  readonly time: string;
  readonly title: string;
  readonly meta: string | null;
  readonly detail: string | null;
  readonly accent: boolean;
};

const CUTOFF_HOURS = 720;

export function visitStamp(value: string, locale: Locale): string {
  return formatDateTime(value, locale);
}

export function reasonLabel(
  options: readonly ReasonOption[],
  key: string | null | undefined,
  locale: Locale,
): string | null {
  if (!key) return null;
  const option = options.find(item => item.key === key);
  if (!option) return key;
  return locale === "ar" ? option.label_ar ?? option.label_en : option.label_en;
}

export function buildVisitDerivations(data: VisitDetailData, locale: Locale) {
  const { visit, lifecycle, audit } = data;
  const inspection = visit.inspections;
  const assignment = visit.assignments?.[0] ?? null;
  const geoEvents = (visit.journey_sessions ?? [])
    .flatMap(session => session.geo_events)
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const preStart = !inspection || inspection.status === "not_started";
  const canManage = visit.planning_status === "published" && visit.operational_state === "new";
  const canReassign = preStart
    && ["published", "returned"].includes(visit.planning_status)
    && data.canReassignByRole;
  const isFinal = ["cancelled", "expired"].includes(visit.planning_status);
  const latestReturn = lifecycle.find(event => event.event_type === "return") ?? null;
  const latestCancel = lifecycle.find(event => event.event_type === "cancel") ?? null;
  const legacyReturnReason = visit.planning_status === "returned"
    && typeof visit.notes === "string" && visit.notes.startsWith("RETURNED: ")
    ? visit.notes.slice("RETURNED: ".length)
    : null;
  const returnReason = latestReturn
    ? reasonLabel(data.returnReasons, latestReturn.reason_key, locale)
    : legacyReturnReason;
  const submissions = inspection
    ? [...inspection.submission_versions].sort((a, b) => a.version_number - b.version_number)
    : [];
  const reviews = inspection?.reviews ?? [];
  return {
    inspection,
    assignment,
    geoEvents,
    latestGeo: geoEvents[0] as VisitGeoEvent | undefined,
    latestAudit: audit[0],
    latestSubmission: submissions[submissions.length - 1],
    latestReview: reviews[reviews.length - 1],
    submissions,
    reviews,
    preStart,
    canManage,
    canReassign,
    isFinal,
    latestReturn,
    latestCancel,
    returnReason,
    cancelReasonDisplay:
      reasonLabel(data.cancelReasons, visit.cancellation_reason, locale) ?? visit.cancellation_reason,
    windowLabel: `${formatDateTime(visit.window_start, locale)} → ${formatDateTime(visit.window_end, locale)}`,
    cutoffDisplay: formatDateTime(
      new Date(new Date(visit.window_start).getTime() - CUTOFF_HOURS * 60 * 60 * 1000),
      locale,
    ),
    isUnverifiedManual: Boolean(visit.factories?.is_temporary && visit.factories.source === "immediate_manual"),
  };
}

export function buildLifecycleEntries(
  lifecycle: readonly LifecycleRow[],
  returnReasons: readonly ReasonOption[],
  cancelReasons: readonly ReasonOption[],
  locale: Locale,
  label: (eventType: string) => string,
  actorLabel: (actor: string | null) => string,
): TimedEntry[] {
  return lifecycle.map(event => {
    const reason = event.event_type === "return"
      ? reasonLabel(returnReasons, event.reason_key, locale)
      : event.event_type === "cancel"
        ? reasonLabel(cancelReasons, event.reason_key, locale)
        : event.reason_key;
    return {
      id: event.id,
      dateTime: event.created_at,
      time: formatDateTime(event.created_at, locale),
      title: label(event.event_type),
      meta: actorLabel(event.actor),
      detail: [reason, event.comments].filter(Boolean).join(" · ") || null,
      accent: ["return", "cancel", "expire"].includes(event.event_type),
    };
  });
}

export function buildLocationEntries(
  data: VisitDetailData,
  locale: Locale,
  label: (source: string) => string,
  actorLabel: (actor: string | null) => string,
): TimedEntry[] {
  return data.location.map(event => ({
    id: event.id,
    dateTime: event.created_at,
    time: formatDateTime(event.created_at, locale),
    title: label(event.source),
    meta: `${event.lat}, ${event.lng} · ${actorLabel(event.actor)}`,
    detail: event.note,
    accent: false,
  }));
}

export function buildJourneyEntries(
  geoEvents: readonly VisitGeoEvent[],
  locale: Locale,
  label: (kind: string) => string,
  accuracyLabel: (metres: number | null) => string,
): TimedEntry[] {
  return geoEvents.map(event => ({
    id: `${event.occurred_at}-${event.kind}`,
    dateTime: event.occurred_at,
    time: formatDateTime(event.occurred_at, locale),
    title: label(event.kind),
    meta: [accuracyLabel(event.accuracy_m), event.gis_version].filter(Boolean).join(" · "),
    detail: event.geofence_result ? label(event.geofence_result) : null,
    accent: event.kind === "checkin",
  }));
}

export function buildAuditEntries(
  data: VisitDetailData,
  locale: Locale,
  label: (action: string) => string,
  actorLabel: (actor: string | null) => string,
): TimedEntry[] {
  return data.audit.map(event => ({
    id: event.id,
    dateTime: event.occurred_at,
    time: formatDateTime(event.occurred_at, locale),
    title: label(event.action),
    meta: actorLabel(event.actor),
    detail: null,
    accent: false,
  }));
}
