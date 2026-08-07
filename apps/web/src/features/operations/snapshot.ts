import type { PostgrestPage } from "@/lib/supabase-pagination";
import { loadEngineSettings, loadNotifications, loadOverrideEvidence, loadPendingOverrides } from "./sources/alerts";
import { loadFactories, loadRiskBoard } from "./sources/factories";
import { loadGeoEvents } from "./sources/geo";
import { loadAuthorizedScope } from "./sources/profile";
import { loadActionForms, loadVisits } from "./sources/visits";
import type { OperationsClient } from "./sources/client-type";
import type { OperationsScope } from "./scope";
import type { OperationsSnapshot, OperationsSourceKey, VisitRow } from "./types";

const GEO_ELIGIBLE_STATES = ["on_the_way", "arrived", "executing"];

function rows<T>(page: PostgrestPage<T>): T[] {
  return page.data ?? [];
}

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

  const geo = await loadGeoEvents(sb, geoVisitIds(rows(visits), scope), nowIso);

  const failedSources = ([
    visits.error && "visits",
    actions.error && "actions",
    notifications.error && "notifications",
    factories.error && "factories",
    settings.error && "settings",
    risk.error && "risk",
    overrides.error && "overrides",
    evidence.error && "evidence",
    geo.error && "geo",
  ] as (OperationsSourceKey | null | false | "")[])
    .filter((key): key is OperationsSourceKey => Boolean(key));

  return {
    visits: rows(visits),
    actions: rows(actions),
    notifications: rows(notifications),
    factories: rows(factories),
    settings: rows(settings),
    risk: rows(risk),
    overrides: rows(overrides),
    evidence: rows(evidence),
    geo: rows(geo),
    authorizedScope,
    capturedAt: nowIso,
    failedSources,
  };
}
