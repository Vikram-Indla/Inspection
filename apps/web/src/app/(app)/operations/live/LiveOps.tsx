"use client";

import { Suspense, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import EmptyState from "@/components/EmptyState";
import styles from "./live.module.css";

export type LiveOpsStrings = {
  loading: string;
  enRoute: string;
  executing: string;
  completed: string;
  totalsLabel: string;
  inspector: string;
  projected: string;
  freshnessPolicy: string;
  lastObserved: string;
  snapshotGenerated: string;
  noRecordedPositions: string;
  activeList: string;
  since: string;
  noScope: string;
  noPositions: string;
  loadError: string;
  retry: string;
  providerFailed: string;
  mapUnavailable: string;
  mapboxNotConfigured: string;
  mapAriaLabel: string;
  wallboardExit: string;
  selectedInspector: string;
  inspectorName: string;
  factoryName: string;
  regionName: string;
  operationalState: string;
  visitReference: string;
  closeDetails: string;
  dataIntegrity: string;
  outOfScopeGeography: string;
  positionSourceField: string;
  positionObservedField: string;
  openVisit: string;
  active: string;
  arrived: string;
  recordedState: string;
  unavailableState: string;
  rejectedState: string;
  partialSource: string;
  factorySourceUnavailable: string;
  sourceNotRecorded: string;
};

const Map = dynamic(() => import("./LiveMapInner"), { ssr: false });

export default function LiveOps({
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
  const enRoute = inspectors.filter(inspector => inspector.state === "on_the_way").length;
  const arrived = inspectors.filter(inspector => inspector.state === "arrived").length;
  const selectedInspector = inspectors.find(inspector => inspector.id === selectedId) ?? null;
  const noScopeRows = factories.length === 0 && inspectors.length === 0;
  const hasNoPositions = factories.length > 0
    && !inspectors.some(inspector => inspector.lat != null && inspector.lng != null);
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Riyadh",
  });
  const formattedSnapshotAt = dateFormatter.format(new Date(snapshotAt));
  const formattedPositionObservedAt = positionObservedAt
    ? dateFormatter.format(new Date(positionObservedAt))
    : null;
  const provenanceLabel = (inspector: LiveInspector) => inspector.positionState === "recorded"
    ? s.recordedState
    : inspector.positionState === "rejected" ? s.rejectedState : s.unavailableState;
  const provenanceClass = (inspector: LiveInspector) => inspector.positionState === "recorded"
    ? styles.provenanceRecorded
    : inspector.positionState === "rejected" ? styles.provenanceRejected : styles.provenanceUnavailable;

  return (
    <div className={`${styles.page} ${wallboard ? styles.wallboard : ""}`} data-testid="operations-live">
      <header className={styles.header}>
        <div>
          <div className={styles.provenanceLegend} aria-label={s.dataIntegrity}>
            <span className={`${styles.provenance} ${styles.provenanceRecorded}`}>{s.recordedState}</span>
            <span className={`${styles.provenance} ${styles.provenanceUnavailable}`}>{s.unavailableState}</span>
            <span className={`${styles.provenance} ${styles.provenanceRejected}`}>{s.rejectedState}</span>
          </div>
          <p className={styles.freshness}>
            <span>{s.snapshotGenerated}: <time data-testid="live-snapshot-at" dateTime={snapshotAt}>{formattedSnapshotAt}</time></span>
            <span>{formattedPositionObservedAt
              ? <>{s.lastObserved}: <time dateTime={positionObservedAt!}>{formattedPositionObservedAt}</time></>
              : s.noRecordedPositions}</span>
            <span>{s.freshnessPolicy}</span>
          </p>
          {excludedRecordCount > 0 ? (
            <p className={styles.dataIntegrity} role="status">
              {s.dataIntegrity} <strong>{excludedRecordCount}</strong>
            </p>
          ) : null}
          {outOfScopeRecordCount > 0 ? (
            <p className={styles.dataIntegrity} role="status">
              {s.outOfScopeGeography} <strong>{outOfScopeRecordCount}</strong>
            </p>
          ) : null}
          {positionReadError ? <p className={styles.partialSource} role="alert">{s.partialSource}</p> : null}
          {factoryReadError ? <p className={styles.partialSource} role="status">{s.factorySourceUnavailable}</p> : null}
        </div>
        {wallboard ? <a className="sq-btn sq-btn--secondary" href="/operations/live">{s.wallboardExit}</a> : null}
      </header>

      <div className={styles.counters} aria-label={s.totalsLabel}>
        <article className={styles.counter}><strong>{inspectors.length}</strong><span>{s.active}</span></article>
        <article className={styles.counter}><strong>{enRoute}</strong><span>{s.enRoute}</span></article>
        <article className={styles.counter}><strong>{arrived}</strong><span>{s.arrived}</span></article>
      </div>

      <div className={styles.workspace}>
        <section className={styles.mapFrame} aria-label={s.mapAriaLabel}>
          {visitReadError ? (
            <EmptyState glyph="!" title={s.loadError} bare role="alert">
              <button className="sq-btn sq-btn--secondary" type="button" onClick={() => window.location.reload()}>{s.retry}</button>
            </EmptyState>
          ) : providerFailed ? (
            <EmptyState glyph="⌖" title={s.providerFailed} bare role="status">
              <button className="sq-btn sq-btn--secondary" type="button" onClick={retryProvider}>{s.retry}</button>
            </EmptyState>
          ) : (
            <>
              <Suspense fallback={<EmptyState glyph="…" title={s.loading} bare role="status" ariaBusy />}>
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
              {noScopeRows || hasNoPositions ? (
                <p className={styles.mapNotice} role="status">{noScopeRows ? s.noScope : s.noPositions}</p>
              ) : null}
            </>
          )}
        </section>

        <aside className={styles.list} aria-labelledby="live-inspector-list-title">
          <div className={styles.listHeader}>
            <h2 id="live-inspector-list-title">{s.activeList}</h2>
            <span className="sq-lozenge sq-lozenge--neutral">{inspectors.length}</span>
          </div>
          {selectedInspector ? (
            <section
              className={styles.selectionCard}
              aria-live="polite"
              aria-labelledby="selected-inspector-title"
              data-testid="live-inspector-details"
            >
              <div className={styles.selectionHeader}>
                <h3 id="selected-inspector-title">{s.selectedInspector}</h3>
                <button type="button" onClick={() => setSelectedId(null)} aria-label={s.closeDetails}>×</button>
              </div>
              <dl className={styles.selectionDetails}>
                <div><dt>{s.inspectorName}</dt><dd><bdi dir="auto">{selectedInspector.inspector}</bdi></dd></div>
                <div><dt>{s.factoryName}</dt><dd>{selectedInspector.factoryName}</dd></div>
                <div><dt>{s.regionName}</dt><dd>{selectedInspector.region}</dd></div>
                <div><dt>{s.operationalState}</dt><dd>{selectedInspector.stateLabel}</dd></div>
                <div>
                  <dt>{s.since}</dt>
                  <dd>{selectedInspector.sinceAt
                    ? <time dateTime={selectedInspector.sinceAt}>{selectedInspector.sinceLabel}</time>
                    : selectedInspector.sinceLabel}</dd>
                </div>
                <div><dt>{s.visitReference}</dt><dd>{selectedInspector.visitId}</dd></div>
                <div>
                  <dt>{s.positionSourceField}</dt>
                  <dd>{selectedInspector.positionSourceLabel ?? s.sourceNotRecorded}</dd>
                </div>
                <div>
                  <dt>{s.positionObservedField}</dt>
                  <dd>{selectedInspector.positionObservedAt
                    ? <time dateTime={selectedInspector.positionObservedAt}>{selectedInspector.positionObservedLabel}</time>
                    : selectedInspector.positionObservedLabel}</dd>
                </div>
              </dl>
              <p className={`${styles.provenance} ${provenanceClass(selectedInspector)}`}>
                {provenanceLabel(selectedInspector)}
              </p>
              <a className="sq-btn sq-btn--secondary" href={`/visits/${selectedInspector.visitId}`}>{s.openVisit}</a>
            </section>
          ) : null}
          {inspectors.length ? (
            <ul className={styles.listItems}>
              {inspectors.map(inspector => (
                <li key={inspector.id}>
                  <button
                    type="button"
                    className={styles.listButton}
                    aria-pressed={selectedId === inspector.id}
                    onClick={() => setSelectedId(inspector.id)}
                  >
                    <span>
                      <strong>{inspector.factoryName}</strong>
                      <small>{inspector.region} · <bdi dir="auto">{inspector.inspector}</bdi></small>
                      <span className={`${styles.provenance} ${provenanceClass(inspector)}`}>
                        {provenanceLabel(inspector)}
                      </span>
                      <small>
                        {s.positionSourceField}: {inspector.positionSourceLabel ?? s.sourceNotRecorded}
                        {" · "}
                        {s.positionObservedField}: {inspector.positionObservedAt
                          ? <time dateTime={inspector.positionObservedAt}>{inspector.positionObservedLabel}</time>
                          : inspector.positionObservedLabel}
                      </small>
                    </span>
                    <span>
                      <span className="sq-lozenge sq-lozenge--info">{inspector.stateLabel}</span>
                      <small>
                        {s.since}: {inspector.sinceAt
                          ? <time data-live-since dateTime={inspector.sinceAt}>{inspector.sinceLabel}</time>
                          : inspector.sinceLabel}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyList}>{noScopeRows ? s.noScope : s.noPositions}</p>
          )}
        </aside>
      </div>

      <footer className={styles.legend} role="note">
        <span className={styles.marker} aria-hidden="true">●</span>
        <span>{s.inspector}</span>
        <strong>{s.freshnessPolicy}</strong>
      </footer>
    </div>
  );
}
