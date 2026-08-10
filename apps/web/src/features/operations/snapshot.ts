import { loadEngineSettings, loadNotifications, loadOverrideEvidence, loadPendingOverrides } from "./sources/alerts";
import { loadFactories, loadRiskBoard } from "./sources/factories";
import { loadGeoEvents } from "./sources/geo";
import { loadAuthorizedScope } from "./sources/profile";
import { loadActionForms, loadVisits } from "./sources/visits";
import type { OperationsClient } from "./sources/client-type";
import type { OperationsScope } from "./scope";
import type { OperationsSnapshot, OperationsSourceKey, VisitRow } from "./types";

const GEO_ELIGIBLE_STATES = ["on_the_way", "arrived", "executing"];

function geoVisitIds(visits: readonly VisitRow[], scope: OperationsScope): string[] {
  return visits
    .filter(visit =>
      (visit.planning_status === "published" || GEO_ELIGIBLE_STATES.includes(visit.operational_state))
      && (!scope.region || visit.factories?.region === scope.region)
      && (!scope.city || visit.factories?.city === scope.city))
    .map(visit => visit.id);
}

export async function readOperationsSnapshot(
  sb: OperationsClient,
  scope: OperationsScope,
  userId: string,
  factoryCodes: readonly string[],
  nowIso: string,
): Promise<OperationsSnapshot> {
  const [authorizedScope, visits, actions, notifications, factories, settings, risk, overrides, evidence] =
    await Promise.all([
      loadAuthorizedScope(sb, userId),
      loadVisits(sb),
      loadActionForms(sb),
      loadNotifications(sb),
      loadFactories(sb, factoryCodes),
      loadEngineSettings(sb),
      loadRiskBoard(sb, factoryCodes),
      loadPendingOverrides(sb, nowIso),
      loadOverrideEvidence(sb),
    ]);

  const geo = await loadGeoEvents(sb, geoVisitIds(visits.rows, scope), nowIso);

  const failedSources = ([
    visits.failed && "visits",
    actions.failed && "actions",
    notifications.failed && "notifications",
    factories.failed && "factories",
    settings.failed && "settings",
    risk.failed && "risk",
    overrides.failed && "overrides",
    evidence.failed && "evidence",
    geo.failed && "geo",
  ] as (OperationsSourceKey | false)[])
    .filter((key): key is OperationsSourceKey => Boolean(key));

  return {
    visits: visits.rows,
    actions: actions.rows,
    notifications: notifications.rows,
    factories: factories.rows,
    settings: settings.rows,
    risk: risk.rows,
    overrides: overrides.rows,
    evidence: evidence.rows,
    geo: geo.rows,
    authorizedScope,
    capturedAt: nowIso,
    failedSources,
  };
}
