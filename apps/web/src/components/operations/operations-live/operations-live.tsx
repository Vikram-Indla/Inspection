"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useState } from "react";
import Button from "@/components/saqeel/button/button";
import { CardGrid } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Stack from "@/components/saqeel/stack/stack";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import type { LiveFactory, LiveInspector, LiveRegion } from "@/app/(app)/operations/live/types";
import LiveMapCard, { type LiveDisclosure } from "./live-map-card";
import LiveInspectorPanel from "./live-inspector-panel";
import type { LiveOpsStrings } from "./strings";
import styles from "./operations-live.module.css";

const Map = dynamic(() => import("@/app/(app)/operations/live/LiveMapInner"), { ssr: false });

export default function OperationsLive({
  factories,
  regions,
  inspectors,
  strings: s,
  snapshotAt,
  positionObservedAt,
  wallboard,
  visitReadError,
  positionReadError,
  factoryReadError,
  excludedRecordCount,
  outOfScopeRecordCount,
  locale,
}: {
  factories: LiveFactory[];
  regions: LiveRegion[];
  inspectors: LiveInspector[];
  strings: LiveOpsStrings;
  snapshotAt: string;
  positionObservedAt: string | null;
  wallboard: boolean;
  visitReadError: boolean;
  positionReadError: boolean;
  factoryReadError: boolean;
  excludedRecordCount: number;
  outOfScopeRecordCount: number;
  locale: "en" | "ar";
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [providerFailed, setProviderFailed] = useState(false);
  const [providerAttempt, setProviderAttempt] = useState(0);
  const markProviderFailed = useCallback(() => setProviderFailed(true), []);
  const retryProvider = useCallback(() => {
    setProviderFailed(false);
    setProviderAttempt(attempt => attempt + 1);
  }, []);
  const clearSelection = useCallback(() => setSelectedId(null), []);
  const enRoute = inspectors.filter(inspector => inspector.state === "on_the_way").length;
  const arrived = inspectors.filter(inspector => inspector.state === "arrived").length;
  const selectedInspector = inspectors.find(inspector => inspector.id === selectedId) ?? null;
  const noScopeRows = factories.length === 0 && inspectors.length === 0;
  const hasNoPositions = factories.length > 0
    && !inspectors.some(inspector => inspector.lat != null && inspector.lng != null);
  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Riyadh",
  });
  const pillCandidates: ({ id: string; label: string } | null)[] = [
    inspectors.some(inspector => inspector.positionState === "unavailable")
      ? { id: "unavailable", label: s.unavailableState } : null,
    inspectors.some(inspector => inspector.positionState === "rejected")
      ? { id: "rejected", label: s.rejectedState } : null,
  ];
  const statePills = pillCandidates.filter((pill): pill is { id: string; label: string } => pill !== null);
  const candidates: (LiveDisclosure | null)[] = [
    excludedRecordCount > 0
      ? { id: "excluded", text: `${s.dataIntegrity} ${excludedRecordCount}`, live: "status" } : null,
    outOfScopeRecordCount > 0
      ? { id: "scope", text: `${s.outOfScopeGeography} ${outOfScopeRecordCount}`, live: "status" } : null,
    positionReadError ? { id: "positions", text: s.partialSource, live: "alert" } : null,
    factoryReadError ? { id: "factories", text: s.factorySourceUnavailable, live: "status" } : null,
    hasNoPositions && inspectors.length > 0
      ? { id: "unmapped", text: s.noPositions, live: "status" } : null,
  ];
  const disclosures = candidates.filter((item): item is LiveDisclosure => item !== null);

  return (
    <Stack>
      <div data-testid="operations-live" data-wallboard={wallboard ? "true" : "false"} className={styles.screen}>
        {wallboard ? (
          <Button variant="secondary" size="sm" href="/operations/live" label={s.wallboardExit}>
            {s.wallboardExit}
          </Button>
        ) : null}

        <section aria-label={s.totalsLabel}>
          <CardGrid min="sm">
            <StatCard label={s.active} value={String(inspectors.length)} />
            <StatCard label={s.enRoute} value={String(enRoute)} />
            <StatCard label={s.arrived} value={String(arrived)} />
          </CardGrid>
        </section>

        <div className={styles.split}>
          <LiveMapCard
            count={inspectors.length}
            snapshotAt={snapshotAt}
            snapshotLabel={timeFormatter.format(new Date(snapshotAt))}
            positionObservedAt={positionObservedAt}
            positionObservedLabel={positionObservedAt
              ? timeFormatter.format(new Date(positionObservedAt))
              : null}
            statePills={statePills}
            disclosures={disclosures}
            strings={s}
          >
            {visitReadError ? (
              <EmptyState
                icon="risk" tone="danger" title={s.loadError}
                action={<Button variant="secondary" size="sm" icon="refresh" href="/operations/live" label={s.retry}>{s.retry}</Button>}
              />
            ) : providerFailed ? (
              <EmptyState
                icon="map" tone="warning" title={s.providerFailed}
                action={<Button variant="secondary" size="sm" icon="refresh" onClick={retryProvider} label={s.retry}>{s.retry}</Button>}
              />
            ) : (
              <Suspense fallback={<EmptyState icon="map" title={s.loading} busy />}>
                <Map
                  key={providerAttempt}
                  factories={factories}
                  regions={regions}
                  inspectors={inspectors}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onProviderFailure={markProviderFailed}
                  strings={{
                    unavailable: s.mapUnavailable,
                    notConfigured: s.mapboxNotConfigured,
                    ariaLabel: s.mapAriaLabel,
                  }}
                />
              </Suspense>
            )}
          </LiveMapCard>

          <LiveInspectorPanel
            inspectors={inspectors}
            selectedId={selectedId}
            selectedInspector={selectedInspector}
            onSelect={setSelectedId}
            onClear={clearSelection}
            emptyBody={noScopeRows ? s.noScope : s.noPositions}
            strings={s}
          />
        </div>
      </div>
    </Stack>
  );
}
