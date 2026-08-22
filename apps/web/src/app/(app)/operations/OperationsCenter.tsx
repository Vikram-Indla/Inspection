"use client";

import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import Stack from "@/components/saqeel/stack/stack";
import OperationsEntryTable from "@/components/operations/operations-entry-table/operations-entry-table";
import OperationsExceptions from "@/components/operations/operations-exceptions/operations-exceptions";
import OperationsMapPanel from "@/components/operations/operations-map-panel/operations-map-panel";
import OperationsStates from "@/components/operations/operations-states/operations-states";
import { OperationsRegions, OperationsSummary } from "@/components/operations/operations-summary/operations-summary";
import OperationsToolbar from "@/components/operations/operations-toolbar/operations-toolbar";
import { fill, getMessages } from "@/i18n/messages";
import { localeHref } from "@/lib/locale-path";
import OperationsMapWorkspace, {
  type OperationsMapEntry,
  type OperationsMapWorkspaceStrings,
} from "./OperationsMapWorkspace";

type Locale = "en" | "ar";
type Highlight = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  at: number;
  atLabel: string | null;
  href: string;
  evidenceUrl: string | null;
};
type RegionSummary = {
  name: string;
  factories: number;
  active: number;
  href: string;
};

export default function OperationsCenter({
  locale,
  view,
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
  const notConfigured = common.state.notConfigured;
  const summary = [
    { label: stat.activeVisits, value: String(monitoredCount), configured: true, href: localeHref(locale, "/execution"), action: stat.openExecution },
    { label: stat.onTheWay, value: String(onTheWayInspectors || counts.on_the_way || 0), configured: true },
    { label: stat.executing, value: String(counts.executing || 0), configured: true },
    { label: stat.submittedToday, value: notConfigured, configured: false },
    { label: stat.alerts, value: notConfigured, configured: false },
  ];

  return (
    <Stack>
      <OperationsToolbar
        view={activeView}
        onViewChange={setActiveView}
        showList={showList}
        onToggleList={() => setShowList(value => !value)}
        strings={{
          label: operations.perspective.label,
          map: operations.perspective.map,
          performance: operations.perspective.performance,
          showList: operations.action.showList,
          showMap: operations.action.showMap,
        }}
      />

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
              na: common.state.na,
              emptyTitle: operations.table.emptyTitle,
            }}
          />
      ) : (
          <OperationsMapPanel
            title={operations.map.title}
            count={activeMapEntries.length}
            countLabel={operations.map.countLabel}
            action={
              <Button variant="secondary" size="sm" href={liveHref} label={operations.action.livePositions}>
                {operations.action.livePositions}
              </Button>
            }
          >
            <OperationsMapWorkspace entries={activeMapEntries} strings={mapStrings} mapOnly />
          </OperationsMapPanel>
      )}

      {activeView === "performance" ? (
        <OperationsRegions
          title={operations.regions.title}
          unavailable={operations.regions.unavailable}
          regions={regions.map(region => ({
            name: region.name,
            href: region.href,
            active: String(region.active),
            detail: fill(operations.regions.detail, { factories: region.factories, active: region.active }),
          }))}
        />
      ) : null}

      <OperationsSummary title={operations.summary.title} stats={summary} />

      <OperationsStates counts={counts} locale={locale} strings={operations.states} />

      <OperationsExceptions
        rows={highlights}
        boardHref={exceptionsHref}
        strings={{
          title: operations.exceptions.title,
          scope: operations.exceptions.scope,
          openBoard: operations.action.exceptionBoard,
          openRecord: operations.exceptions.openRecord,
          emptyTitle: operations.exceptions.emptyTitle,
          emptyBody: operations.exceptions.emptyBody,
        }}
      />
    </Stack>
  );
}
