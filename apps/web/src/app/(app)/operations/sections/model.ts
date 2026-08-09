import { computeResubmissionFlags, computeSlaFlags, type SlaConf } from "../sla";
import type { MonitorRow } from "../actions";
import { localePersonName, type OperationsData } from "@/features/operations/queries";
import type { OperationsScope } from "@/features/operations/scope";
import type { GeoRow } from "@/features/operations/types";

const OPERATIONAL_STATES = ["new", "prepared", "on_the_way", "arrived", "executing", "submitted", "under_review"] as const;

type GisConf = { geofence_default_radius_m?: number };

export function buildOperationsModel(data: OperationsData, scope: OperationsScope) {
  const { visits, geo, actions, notifs, factories, engines, now } = data;
  const { region, city } = scope;
  const states = OPERATIONAL_STATES;
  const counts = Object.fromEntries(states.map(s => [s, visits.filter(v => v.operational_state === s).length]));
  const monitored = visits.filter(v =>
    (v.planning_status === "published" || ["on_the_way", "arrived", "executing"].includes(v.operational_state)) &&
    (!region || v.factories?.region === region) && (!city || v.factories?.city === city));
  const monitoredVisitIds = new Set(monitored.map(v => v.id));
  const scopedGeo = geo.filter(g => monitoredVisitIds.has(g.visit_id)
    && (g.integration_mode == null || g.integration_mode === "production")
    && Number.isFinite(Date.parse(g.occurred_at))
    && Date.parse(g.occurred_at) <= now);
  const latestGeoByVisit = new Map<string, GeoRow>();
  for (const event of scopedGeo) {
    if (!latestGeoByVisit.has(event.visit_id)) latestGeoByVisit.set(event.visit_id, event);
  }
  const latestGeofence = new Map<string, string>();
  for (const g of scopedGeo) {
    if (g.geofence_result && !latestGeofence.has(g.visit_id)) latestGeofence.set(g.visit_id, g.geofence_result);
  }
  const latestObservedPosition = new Map<string, GeoRow>();
  for (const event of scopedGeo) {
    const occurredAt = Date.parse(event.occurred_at);
    const lat = Number(event.observed_lat);
    const lng = Number(event.observed_lng);
    const valid = Number.isFinite(occurredAt) && occurredAt <= now
      && Number.isFinite(lat) && lat >= -90 && lat <= 90
      && Number.isFinite(lng) && lng >= -180 && lng <= 180
      && (event.integration_mode == null || event.integration_mode === "production");
    if (valid && !latestObservedPosition.has(event.visit_id)) {
      latestObservedPosition.set(event.visit_id, event);
    }
  }
  const gisConf = (engines.find(e => e.engine === "gis")?.settings ?? {}) as GisConf;
  const slaConf = (engines.find(e => e.engine === "sla")?.settings ?? {}) as SlaConf;
  const slaFlags = computeSlaFlags(monitored, slaConf, now);
  const resubSlaAvailable = typeof slaConf.resubmission_business_days === "number";
  const resubFlags = computeResubmissionFlags(data.resubmissionSources, slaConf, now);
  const scopedFactories = factories.filter(f =>
    (!region || f.region === region) && (!city || f.city === city));
  const regions = [...new Set(factories.map(f => f.region).filter((r): r is string => !!r))].sort();
  const cities = [...new Set(factories
    .filter(f => !region || f.region === region)
    .map(f => f.city).filter((c): c is string => !!c))].sort();
  const rankedFactories = scopedFactories
    .filter(factory => factory.risk_score != null)
    .sort((a, b) => Number(b.risk_score) - Number(a.risk_score));
  const riskRankByFactory = new Map(rankedFactories.map((factory, index) => [factory.id, index + 1]));
  const activeCountByFactory = new Map<string, number>();
  for (const visit of monitored) {
    const factoryId = visit.factories?.id ?? visit.factory_id;
    if (factoryId) activeCountByFactory.set(factoryId, (activeCountByFactory.get(factoryId) ?? 0) + 1);
  }
  const actionCountByFactory = new Map<string, number>();
  for (const action of actions) {
    const factoryId = action.inspections?.visits?.factories?.id;
    if (factoryId) actionCountByFactory.set(factoryId, (actionCountByFactory.get(factoryId) ?? 0) + 1);
  }
  const overdueActions = actions.filter(action => action.due_at && Date.parse(action.due_at) < now);
  const failedNotifications = notifs.filter(notification => notification.delivery_state === "failed");
  const overdueVisitIds = new Set(
    slaFlags
      .filter(flag => flag.kind === "overdue_start" || flag.kind === "overdue_submit")
      .map(flag => flag.visit.id),
  );
  const geoHistoryRows = scopedGeo.slice(0, 100);
  return {
    states, counts, monitored, scopedGeo, latestGeoByVisit, latestGeofence, latestObservedPosition,
    gisConf, slaConf, slaFlags, resubSlaAvailable, resubFlags, scopedFactories, regions, cities,
    rankedFactories, riskRankByFactory, activeCountByFactory, actionCountByFactory,
    overdueActions, failedNotifications, overdueVisitIds, geoHistoryRows,
  };
}

export type OperationsModel = ReturnType<typeof buildOperationsModel>;

export function buildMonitorRows(data: OperationsData, model: OperationsModel): MonitorRow[] {
  return model.monitored.map(v => ({
    id: v.id,
    factory_id: v.factories?.id ?? v.factory_id,
    factory_name: v.factories?.name ?? null,
    operational_state: v.operational_state,
    geofence: model.latestGeofence.get(v.id) ?? null,
    inspector: localePersonName(data.locale, v.assignments?.[0]?.profiles?.full_name),
  }));
}

export type WorkloadRow = {
  inspector: string; assigned: number; active: number; completed: number; overdue: number;
};

export function buildWorkloadRows(data: OperationsData, model: OperationsModel): WorkloadRow[] {
  const fallback = data.locale === "ar" ? "اسم المفتش غير متاح" : "Inspector name unavailable";
  const workloadByInspector = new Map<string, WorkloadRow>();
  for (const visit of data.visits) {
    if (!visit.assignments?.[0]?.profiles) continue;
    const inspector = localePersonName(data.locale, visit.assignments?.[0]?.profiles?.full_name) ?? fallback;
    const row = workloadByInspector.get(inspector)
      ?? { inspector, assigned: 0, active: 0, completed: 0, overdue: 0 };
    row.assigned += 1;
    if (["on_the_way", "arrived", "executing"].includes(visit.operational_state)) row.active += 1;
    if (visit.operational_state === "submitted") row.completed += 1;
    if (model.overdueVisitIds.has(visit.id)) row.overdue += 1;
    workloadByInspector.set(inspector, row);
  }
  return [...workloadByInspector.values()]
    .sort((a, b) => b.active - a.active || b.assigned - a.assigned || a.inspector.localeCompare(b.inspector));
}
