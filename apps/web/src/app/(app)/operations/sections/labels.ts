import { formatDateTime } from "@/lib/dates";
import { fill, getMessages } from "@/i18n/messages";
import { humaniseEnum, sentenceCase } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import type { GeoTone } from "@/components/GeoMap";
import { localePersonName, type OperationsData } from "@/features/operations/queries";
import type { OperationsScope } from "@/features/operations/scope";
import type { FactoryRow, VisitRow } from "@/features/operations/types";
import type { SlaFlag } from "../sla";
import type { OpsPin } from "../OpsMap";
import type { OperationsMapEntry } from "../OperationsMapWorkspace";
import type { OperationsModel } from "./model";

export type Translate = (key: string, en: string) => string;

export type Labelers = {
  locale: Locale;
  t: Translate;
  local: (english: string, arabic: string) => string;
  enumLabel: (value: string) => string;
  fmtTs: (ms: number) => string;
};

const ACTIVE_TONE: Record<string, GeoTone> = {
  on_the_way: "medium",
  arrived: "medium",
  executing: "low",
};

export function makeLabelers(locale: Locale, t: Translate): Labelers {
  return {
    locale,
    t,
    local: (english, arabic) => locale === "ar" ? arabic : english,
    enumLabel: value => sentenceCase(t(`enum.${value}`, humaniseEnum(value))),
    fmtTs: ms => formatDateTime(ms, locale === "ar" ? "ar" : "en"),
  };
}

export function buildViewHrefs(scope: OperationsScope) {
  const scopedQuery = [
    scope.region ? `region=${encodeURIComponent(scope.region)}` : "",
    scope.city ? `city=${encodeURIComponent(scope.city)}` : "",
  ].filter(Boolean).join("&");
  const mapViewHref = `/operations${scopedQuery ? `?${scopedQuery}` : ""}`;
  const performanceViewHref = `/operations?${["view=performance", scopedQuery].filter(Boolean).join("&")}`;
  return {
    mapViewHref,
    performanceViewHref,
    performanceAnchor: (anchor: string) => `${performanceViewHref}#${anchor}`,
  };
}

export function slaKindLabel(lab: Labelers, flag: SlaFlag<VisitRow>): string {
  const highlights = getMessages(lab.locale).operations.highlights;
  return flag.kind === "overdue_start" ? highlights.overdueStart
    : flag.kind === "overdue_submit" ? highlights.overdueSubmit
      : fill(highlights.reminder, { pct: flag.pct });
}

export function kpiMetricLabel(lab: Labelers, metric: string): string {
  return ({
    visits_planned: lab.local("Visits planned", "الزيارات المخططة"),
    visits_completed: lab.local("Visits completed", "الزيارات المكتملة"),
    visits_cancelled: lab.local("Visits cancelled", "الزيارات الملغاة"),
    visits_overdue: lab.local("Visits overdue", "الزيارات المتأخرة"),
    active_inspectors: lab.local("Active inspectors", "المفتشون النشطون"),
    average_duration: lab.local("Average duration", "متوسط المدة"),
    sla_breach_rate: lab.local("Deadline breach rate", "معدل تجاوز الموعد النهائي"),
  } as Record<string, string>)[metric] ?? humaniseEnum(metric);
}

function previewFields(
  data: OperationsData,
  model: OperationsModel,
  lab: Labelers,
  factory: FactoryRow | undefined,
  visit: VisitRow | undefined,
) {
  const sourceInspectorName = visit?.assignments?.[0]?.profiles?.full_name ?? null;
  const latestGeoEvent = visit ? model.latestGeoByVisit.get(visit.id) ?? null : null;
  return {
    factoryId: factory?.id ?? visit?.factories?.id ?? visit?.factory_id ?? null,
    factoryName: factory?.name ?? visit?.factories?.name ?? "—",
    region: factory?.region ?? visit?.factories?.region ?? null,
    city: factory?.city ?? visit?.factories?.city ?? null,
    visitId: visit?.id ?? null,
    inspectorName: localePersonName(data.locale, sourceInspectorName),
    assignmentCount: sourceInspectorName
      ? model.monitored.filter(item => item.assignments?.[0]?.profiles?.full_name === sourceInspectorName).length
      : 0,
    lastGeoAt: latestGeoEvent ? lab.fmtTs(Date.parse(latestGeoEvent.occurred_at)) : null,
    riskScore: factory?.risk_score ?? null,
    riskRank: factory ? model.riskRankByFactory.get(factory.id) ?? null : null,
    riskRankTotal: model.rankedFactories.length,
    activeVisitCount: factory ? model.activeCountByFactory.get(factory.id) ?? 0 : 0,
    openActionCount: factory ? model.actionCountByFactory.get(factory.id) ?? 0 : 0,
  };
}

export function buildMapEntries(data: OperationsData, model: OperationsModel, lab: Labelers): OperationsMapEntry[] {
  const pins: OpsPin[] = [];
  const pinnedFactoryIds = new Set<string>();
  for (const v of model.monitored) {
    const tone = ACTIVE_TONE[v.operational_state];
    if (!tone) continue;
    const f = model.scopedFactories.find(x => x.id === (v.factories?.id ?? v.factory_id));
    const observed = model.latestObservedPosition.get(v.id);
    if (!f || !observed) continue;
    pinnedFactoryIds.add(f.id);
    pins.push({
      id: `v:${v.id}`, kind: "visit",
      lat: Number(observed.observed_lat), lng: Number(observed.observed_lng),
      label: `${f.name} · ${lab.enumLabel(v.operational_state)} · ${lab.enumLabel(observed.kind)} · ${lab.fmtTs(Date.parse(observed.occurred_at))}`,
      tone,
      href: `/visits/${v.id}`,
    });
  }
  for (const f of model.scopedFactories) {
    if (pinnedFactoryIds.has(f.id) || f.official_lat == null || f.official_lng == null) continue;
    pins.push({
      id: `f:${f.id}`, kind: "factory",
      lat: Number(f.official_lat), lng: Number(f.official_lng),
      label: `${f.name} · ${lab.local("Factory list location", "موقع من قائمة المصانع")}`, tone: "neutral",
      href: `/factories/${f.id}`,
    });
  }
  return pins.map(pin => {
    const visit = pin.kind === "visit"
      ? model.monitored.find(item => `v:${item.id}` === pin.id)
      : undefined;
    const factoryId = visit?.factories?.id ?? visit?.factory_id ?? pin.id.replace(/^f:/, "");
    const factory = model.scopedFactories.find(item => item.id === factoryId);
    return {
      ...pin,
      ...previewFields(data, model, lab, factory, visit),
      state: visit ? lab.enumLabel(visit.operational_state) : lab.t("ops.map.factoryState", "Factory"),
    };
  });
}

export function buildRegionalMapEntries(data: OperationsData, model: OperationsModel, lab: Labelers): OperationsMapEntry[] {
  return model.scopedFactories
    .filter(factory => factory.official_lat != null && factory.official_lng != null)
    .map(factory => ({
      id: `regional:${factory.id}`,
      kind: "factory",
      lat: Number(factory.official_lat),
      lng: Number(factory.official_lng),
      label: factory.name,
      tone: "neutral",
      href: `/factories/${factory.id}`,
      ...previewFields(data, model, lab, factory, undefined),
      state: lab.t("ops.map.factoryState", "Factory"),
    }));
}

export type OperationsHighlight = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: number;
  atLabel: string | null;
  href: string;
  evidenceUrl: string | null;
};

export function buildHighlights(
  data: OperationsData,
  model: OperationsModel,
  lab: Labelers,
  performanceAnchor: (anchor: string) => string,
  notRecorded: string,
): OperationsHighlight[] {
  const highlights = getMessages(lab.locale).operations.highlights;
  const stamp = (ms: number) => Number.isFinite(ms) && ms > 0 ? lab.fmtTs(ms) : null;
  return [
    ...model.slaFlags.map(flag => ({
      id: `sla:${flag.visit.id}`,
      kind: highlights.sla,
      title: flag.visit.factories?.name ?? flag.visit.id.slice(0, 8),
      detail: slaKindLabel(lab, flag),
      at: flag.deadlineMs,
      atLabel: stamp(flag.deadlineMs),
      href: `/visits/${flag.visit.id}`,
      evidenceUrl: null as string | null,
    })),
    ...model.overdueActions.map(action => ({
      id: `action:${action.id}`,
      kind: highlights.action,
      title: action.inspections?.visits?.factories?.name ?? localePersonName(data.locale, action.owner_name) ?? action.id.slice(0, 8),
      detail: action.required_correction ?? lab.enumLabel(action.status),
      at: action.due_at ? Date.parse(action.due_at) : 0,
      atLabel: action.due_at ? stamp(Date.parse(action.due_at)) : null,
      href: action.inspections?.visit_id ? `/visits/${action.inspections.visit_id}` : performanceAnchor("corrective-actions"),
      evidenceUrl: null as string | null,
    })),
    ...model.failedNotifications.map(notification => ({
      id: `notification:${notification.id}`,
      kind: highlights.notification,
      title: notification.event_key,
      detail: notification.channel,
      at: Date.parse(notification.created_at),
      atLabel: stamp(Date.parse(notification.created_at)),
      href: performanceAnchor("notifications"),
      evidenceUrl: null as string | null,
    })),
    ...data.overrideQueueRows.map(item => ({
      id: `override:${item.id}`,
      kind: highlights.override,
      title: item.factory_name ?? item.visit_id.slice(0, 8),
      detail: item.inspector_name ?? notRecorded,
      at: Date.parse(item.requested_at),
      atLabel: stamp(Date.parse(item.requested_at)),
      href: `/visits/${item.visit_id}`,
      evidenceUrl: item.evidence_url,
    })),
    ...data.cancellationQueueRows.map(item => ({
      id: `cancellation:${item.id}`,
      kind: highlights.cancellation,
      title: item.factory_name ?? item.visit_id.slice(0, 8),
      detail: item.reason_label,
      at: Date.parse(item.requested_at),
      atLabel: stamp(Date.parse(item.requested_at)),
      href: `/visits/${item.visit_id}`,
      evidenceUrl: item.evidence_url,
    })),
  ].sort((a, b) => b.at - a.at);
}

export function buildRegionSummaries(data: OperationsData, model: OperationsModel) {
  return model.regions.map(regionName => {
    const regionFactories = data.factories.filter(factory => factory.region === regionName);
    const regionVisits = data.visits.filter(visit => visit.factories?.region === regionName);
    const active = regionVisits.filter(visit =>
      visit.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(visit.operational_state));
    return {
      name: regionName,
      factories: regionFactories.length,
      active: active.length,
      href: `/operations?view=performance&region=${encodeURIComponent(regionName)}`,
    };
  });
}
