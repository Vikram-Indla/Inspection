"use client";

import { useState } from "react";
import Stack from "@/components/saqeel/stack/stack";
import OperationsEntryTable from "@/components/sections/operations/operations-entry-table/operations-entry-table";
import OperationsExceptions from "@/components/sections/operations/operations-exceptions/operations-exceptions";
import OperationsMapPanel from "@/components/sections/operations/operations-map-panel/operations-map-panel";
import { OperationsRegions, OperationsSummary } from "@/components/sections/operations/operations-summary/operations-summary";
import OperationsToolbar from "@/components/sections/operations/operations-toolbar/operations-toolbar";
import { fill, getMessages } from "@/i18n/messages";
import { localeHref } from "@/lib/locale-path";
import OperationsMapWorkspace, {
  type OperationsMapEntry,
  type OperationsMapWorkspaceStrings,
} from "./OperationsMapWorkspace";

type Locale = "en" | "ar";
type Highlight = {
  id: string;
  label: string;
  description: string;
  at: number;
  href: string;
  evidenceUrl: string | null;
};
type RegionSummary = {
  name: string;
  factories: number;
  active: number;
  href: string;
};

export default function RevampOperationsCenter({
  locale,
  view,
  mapViewHref,
  mapEntries,
  regionalMapEntries,
  mapStrings,
  counts,
  monitoredCount,
  highlights,
  regions,
}: {
  locale: Locale;
  view: "map" | "performance";
  mapViewHref: string;
  mapEntries: OperationsMapEntry[];
  regionalMapEntries: OperationsMapEntry[];
  mapStrings: OperationsMapWorkspaceStrings;
  counts: Record<string, number>;
  monitoredCount: number;
  highlights: Highlight[];
  regions: RegionSummary[];
}) {
  const { common, operations } = getMessages(locale);
  const liveHref = localeHref(locale, "/operations/live");
  const exceptionsHref = localeHref(locale, "/operations/exceptions");
  const [showList, setShowList] = useState(false);
  const [activeView, setActiveView] = useState<"map" | "performance">(view);
  const activeMapEntries = activeView === "performance" ? regionalMapEntries : mapEntries;
  const onTheWayInspectors = new Set(
    mapEntries
      .filter(entry => entry.state === "on_the_way" || entry.state.toLowerCase().includes("way"))
      .map(entry => entry.inspectorName)
      .filter(Boolean),
  ).size;
  const stat = operations.stat;
  const summary = [
    { label: stat.activeVisits, value: String(monitoredCount), href: localeHref(locale, "/execution"), action: stat.openExecution },
    { label: stat.onTheWay, value: String(onTheWayInspectors || counts.on_the_way || 0), href: mapViewHref, action: stat.showOnMap },
    { label: stat.executing, value: String(counts.executing || 0), href: localeHref(locale, "/execution"), action: stat.openExecution },
    { label: stat.submittedToday, value: "—", href: localeHref(locale, "/reviews"), action: stat.openReviews },
    { label: stat.alerts, value: "—", href: exceptionsHref, action: stat.reviewExceptions },
  ];

  return (
    <Stack>
      <OperationsToolbar
        view={activeView}
        onViewChange={setActiveView}
        showList={showList}
        onToggleList={() => setShowList(value => !value)}
        livePositionsHref={liveHref}
        exceptionBoardHref={exceptionsHref}
        strings={{
          label: operations.perspective.label,
          map: operations.perspective.map,
          performance: operations.perspective.performance,
          livePositions: operations.action.livePositions,
          exceptionBoard: operations.action.exceptionBoard,
          showList: operations.action.showList,
          showMap: operations.action.showMap,
        }}
      />

      {/* Map branch below uses .map-panel + .lv-map: .map-panel sets no height
          and OperationsMapWorkspace fills its parent, so it collapsed to the
          breadcrumb line alone — the reason "View on map" opened nothing. */}
      {showList ? (
          <OperationsEntryTable
            rows={activeMapEntries.map(entry => ({
              id: entry.id,
              inspectorName: entry.inspectorName ?? null,
              state: entry.state,
              visitId: entry.visitId ?? null,
              factoryName: entry.factoryName,
              region: entry.region ?? null,
              city: entry.city ?? null,
              riskScore: entry.riskScore ?? null,
              lastGeoAt: entry.lastGeoAt ?? null,
              href: entry.href,
            }))}
            strings={{
              title: operations.table.title,
              caption: operations.table.caption,
              inspector: operations.table.inspector,
              state: operations.table.state,
              visit: operations.table.visit,
              factory: operations.table.factory,
              location: operations.table.location,
              risk: operations.table.risk,
              lastUpdate: operations.table.lastUpdate,
              actions: operations.table.actions,
              openRecord: operations.table.openRecord,
              notConfigured: common.state.notConfigured,
              emptyTitle: operations.table.emptyTitle,
            }}
          />
      ) : (
          <OperationsMapPanel
            title={operations.map.title}
            description={operations.map.description}
            count={activeMapEntries.length}
            countLabel={operations.map.countLabel}
          >
            <OperationsMapWorkspace entries={activeMapEntries} strings={mapStrings} mapOnly />
          </OperationsMapPanel>
      )}

      {view === "performance" ? (
        <OperationsRegions
          title={operations.regions.title}
          description={operations.regions.description}
          unavailable={operations.regions.unavailable}
          regions={regions.map(region => ({
            name: region.name,
            href: region.href,
            detail: fill(operations.regions.detail, { factories: region.factories, active: region.active }),
          }))}
        />
      ) : null}

      <OperationsSummary title={operations.summary.title} stats={summary} />

      <OperationsExceptions
        rows={highlights}
        strings={{
          title: operations.exceptions.title,
          scope: operations.exceptions.scope,
          open: operations.exceptions.open,
          openRecord: operations.exceptions.openRecord,
          emptyTitle: operations.exceptions.emptyTitle,
          emptyBody: operations.exceptions.emptyBody,
        }}
      />
    </Stack>
  );
}
