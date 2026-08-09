"use client";

import { Suspense, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { LiveFactory, LiveRegion, LiveInspector } from "./types";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

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
  journeyLabel: string;
  operationsCenter: string;
  exceptions: string;
  execution: string;
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
    ? "badge-compliant"
    : inspector.positionState === "rejected" ? "badge-critical" : "badge-pending";

  return (
    <div className="stack" data-testid="operations-live" data-wallboard={wallboard ? "true" : "false"}>
      <header className="page-header">
        <div>
          <div className="row" aria-label={s.dataIntegrity}>
            <span className="badge badge-compliant">{s.recordedState}</span>
            <span className="badge badge-pending">{s.unavailableState}</span>
            <span className="badge badge-critical">{s.rejectedState}</span>
          </div>
          {/* Three inline spans in a plain <p> render with no separator, so the
              caption read as one run-on sentence: "…2:27:33 PMNo recorded
              inspector positionsWe don't track…". Separate the facts explicitly. */}
          <p className="tl-meta">
            <span>{s.snapshotGenerated}: <time data-testid="live-snapshot-at" dateTime={snapshotAt}>{formattedSnapshotAt}</time></span>
            {" · "}
            <span>{formattedPositionObservedAt
              ? <>{s.lastObserved}: <time dateTime={positionObservedAt!}>{formattedPositionObservedAt}</time></>
              : s.noRecordedPositions}</span>
            {" · "}
            <span>{s.freshnessPolicy}</span>
          </p>
          {excludedRecordCount > 0 ? (
            <p className="alert alert-warning" role="status">
              {s.dataIntegrity} <strong>{excludedRecordCount}</strong>
            </p>
          ) : null}
          {outOfScopeRecordCount > 0 ? (
            <p className="alert alert-warning" role="status">
              {s.outOfScopeGeography} <strong>{outOfScopeRecordCount}</strong>
            </p>
          ) : null}
          {positionReadError ? <p className="alert alert-critical" role="alert">{s.partialSource}</p> : null}
          {factoryReadError ? <p className="alert alert-warning" role="status">{s.factorySourceUnavailable}</p> : null}
        </div>
        <nav className="row" aria-label={s.journeyLabel}>
          <Link className="btn btn-secondary" href="/operations">{s.operationsCenter}</Link>
          <Link className="btn btn-secondary" href="/operations/exceptions">{s.exceptions}</Link>
          <Link className="btn btn-secondary" href="/execution">{s.execution}</Link>
          {wallboard ? <Link className="btn btn-secondary" href="/operations/live">{s.wallboardExit}</Link> : null}
        </nav>
      </header>

      <div className="kpi-grid" aria-label={s.totalsLabel}>
        <article className="panel kpi"><strong className="sq-kpi__value">{inspectors.length}</strong><span>{s.active}</span></article>
        <article className="panel kpi"><strong className="sq-kpi__value">{enRoute}</strong><span>{s.enRoute}</span></article>
        <article className="panel kpi"><strong className="sq-kpi__value">{arrived}</strong><span>{s.arrived}</span></article>
      </div>

      <div className="sq-grid-2">
        <section className="map-panel lv-map" aria-label={s.mapAriaLabel}>
          {visitReadError ? (
            <EmptyState glyph="!" title={s.loadError} bare role="alert">
              <button className="btn btn-secondary" type="button" onClick={() => window.location.reload()}>{s.retry}</button>
            </EmptyState>
          ) : providerFailed ? (
            <EmptyState glyph="⌖" title={s.providerFailed} bare role="status">
              <button className="btn btn-secondary" type="button" onClick={retryProvider}>{s.retry}</button>
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
                <p className="alert alert-warning" role="status">{noScopeRows ? s.noScope : s.noPositions}</p>
              ) : null}
            </>
          )}
        </section>

        <aside className="panel stack" aria-labelledby="live-inspector-list-title">
          <div className="panel-row">
            <h2 id="live-inspector-list-title">{s.activeList}</h2>
            <span className="badge badge-info">{inspectors.length}</span>
          </div>
          {selectedInspector ? (
            <section
              className="panel stack"
              aria-live="polite"
              aria-labelledby="selected-inspector-title"
              data-testid="live-inspector-details"
            >
              <div className="panel-row">
                <h3 id="selected-inspector-title">{s.selectedInspector}</h3>
                <button className="btn btn-secondary btn-icon" type="button" onClick={() => setSelectedId(null)} aria-label={s.closeDetails}>×</button>
              </div>
              <dl className="stack">
                <div className="panel-row"><dt>{s.inspectorName}</dt><dd><bdi dir="auto">{selectedInspector.inspector}</bdi></dd></div>
                <div className="panel-row"><dt>{s.factoryName}</dt><dd>{selectedInspector.factoryName}</dd></div>
                <div className="panel-row"><dt>{s.regionName}</dt><dd>{selectedInspector.region}</dd></div>
                <div className="panel-row"><dt>{s.operationalState}</dt><dd>{selectedInspector.stateLabel}</dd></div>
                <div className="panel-row">
                  <dt>{s.since}</dt>
                  <dd>{selectedInspector.sinceAt
                    ? <time dateTime={selectedInspector.sinceAt}>{selectedInspector.sinceLabel}</time>
                    : selectedInspector.sinceLabel}</dd>
                </div>
                <div className="panel-row"><dt>{s.visitReference}</dt><dd>{selectedInspector.visitId}</dd></div>
                <div className="panel-row">
                  <dt>{s.positionSourceField}</dt>
                  <dd>{selectedInspector.positionSourceLabel ?? s.sourceNotRecorded}</dd>
                </div>
                <div className="panel-row">
                  <dt>{s.positionObservedField}</dt>
                  <dd>{selectedInspector.positionObservedAt
                    ? <time dateTime={selectedInspector.positionObservedAt}>{selectedInspector.positionObservedLabel}</time>
                    : selectedInspector.positionObservedLabel}</dd>
                </div>
              </dl>
              <p className={`badge ${provenanceClass(selectedInspector)}`}>
                {provenanceLabel(selectedInspector)}
              </p>
              <Link className="btn btn-secondary" href={`/visits/${selectedInspector.visitId}`}>{s.openVisit}</Link>
            </section>
          ) : null}
          {inspectors.length ? (
            <ul className="stack">
              {inspectors.map(inspector => (
                <li key={inspector.id}>
                  <button
                    type="button"
                    className="panel panel-row"
                    aria-pressed={selectedId === inspector.id}
                    onClick={() => setSelectedId(inspector.id)}
                  >
                    <span>
                      <strong>{inspector.factoryName}</strong>
                      <small>{inspector.region} · <bdi dir="auto">{inspector.inspector}</bdi></small>
                      <span className={`badge ${provenanceClass(inspector)}`}>
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
                      <span className="badge badge-info">{inspector.stateLabel}</span>
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
            <section className="saqeel-state"><div className="saqeel-state__content"><p>{noScopeRows ? s.noScope : s.noPositions}</p></div></section>
          )}
        </aside>
      </div>

      {/* The recording-time disclosure is already stated in the header caption
          and by the "Last recorded position" badge in the legend. Repeating it
          here in <strong> made a caveat the heaviest text on the page. */}
      <footer className="panel-row" role="note">
        <span className="badge badge-info">{s.inspector}</span>
      </footer>
    </div>
  );
}
