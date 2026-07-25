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
  inspector: string;
  // Three truthful per-entity provenance states (M3-MAP-PROVENANCE-001 §3),
  // replacing the single generic "Projected route — not live GPS" claim.
  positionLegend: string;
  provenanceRecorded: string;
  provenanceProjected: string;
  provenanceUnavailable: string;
  freshnessPolicy: string;
  lastObserved: string;
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
};

const Map = dynamic(() => import("./LiveMapInner"), { ssr: false });

export default function LiveOps({
  factories,
  regions,
  inspectors,
  strings: s,
  observedAt,
  wallboard,
  hasReadError,
}: {
  factories: LiveFactory[];
  regions: LiveRegion[];
  inspectors: LiveInspector[];
  strings: LiveOpsStrings;
  observedAt: string;
  wallboard: boolean;
  hasReadError: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [providerFailed, setProviderFailed] = useState(false);
  const markProviderFailed = useCallback(() => setProviderFailed(true), []);
  const enRoute = inspectors.filter(inspector => inspector.state === "on_the_way").length;
  const executing = inspectors.filter(inspector => inspector.state === "executing" || inspector.state === "arrived").length;
  const selectedInspector = inspectors.find(inspector => inspector.id === selectedId) ?? null;
  const noScopeRows = factories.length === 0 && inspectors.length === 0;
  const hasNoPositions = factories.length > 0 && inspectors.length === 0;
  const formattedObservedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Riyadh",
  }).format(new Date(observedAt));
  const provenanceLabel = useCallback((inspector: LiveInspector) => {
    if (inspector.provenance === "recorded") {
      return `${s.provenanceRecorded}${inspector.observedAt ? ` — ${new Date(inspector.observedAt).toLocaleString()}` : ""}`;
    }
    if (inspector.provenance === "projected") {
      return `${s.provenanceProjected}${inspector.scheduledAt ? ` — ${new Date(inspector.scheduledAt).toLocaleString()}` : ""}`;
    }
    return s.provenanceUnavailable;
  }, [s.provenanceRecorded, s.provenanceProjected, s.provenanceUnavailable]);

  return (
    <div className={`${styles.page} ${wallboard ? styles.wallboard : ""}`} data-testid="operations-live">
      <header className={styles.header}>
        <div>
          <p className={styles.disclosure}>{s.positionLegend}</p>
          <p className={styles.freshness}>
            <span>{s.lastObserved}: <time dateTime={observedAt}>{formattedObservedAt}</time></span>
            <span>{s.freshnessPolicy}</span>
          </p>
        </div>
        {wallboard ? <a className="sq-btn sq-btn--secondary" href="/operations/live">{s.wallboardExit}</a> : null}
      </header>

      <div className={styles.counters} aria-label="Live operations totals">
        <article className={styles.counter}><strong>{enRoute}</strong><span>{s.enRoute}</span></article>
        <article className={styles.counter}><strong>{executing}</strong><span>{s.executing}</span></article>
        <article className={styles.counter}><strong>{factories.length}</strong><span>{s.completed}</span></article>
      </div>

      <div className={styles.workspace}>
        <section className={styles.mapFrame} aria-label={s.mapAriaLabel}>
          {hasReadError ? (
            <EmptyState glyph="!" title={s.loadError} bare role="alert">
              <button className="sq-btn sq-btn--secondary" type="button" onClick={() => window.location.reload()}>{s.retry}</button>
            </EmptyState>
          ) : providerFailed ? (
            <EmptyState glyph="⌖" title={s.providerFailed} bare role="status" />
          ) : (
            <>
              <Suspense fallback={<EmptyState glyph="…" title={s.loading} bare role="status" ariaBusy />}>
                <Map
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
                <div><dt>{s.inspectorName}</dt><dd>{selectedInspector.inspector}</dd></div>
                <div><dt>{s.factoryName}</dt><dd>{selectedInspector.factoryName}</dd></div>
                <div><dt>{s.regionName}</dt><dd>{selectedInspector.region}</dd></div>
                <div><dt>{s.operationalState}</dt><dd>{selectedInspector.stateLabel}</dd></div>
                <div><dt>{s.since}</dt><dd>{selectedInspector.sinceLabel}</dd></div>
                <div><dt>{s.visitReference}</dt><dd>{selectedInspector.visitId}</dd></div>
              </dl>
              <p className={styles.selectionDisclosure} data-testid="live-inspector-provenance">{provenanceLabel(selectedInspector)}</p>
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
                    data-provenance={inspector.provenance}
                    onClick={() => setSelectedId(inspector.id)}
                  >
                    <span>
                      <strong>{inspector.factoryName}</strong>
                      <small>{inspector.region} · {inspector.inspector}</small>
                      <small data-testid="live-list-provenance">{provenanceLabel(inspector)}</small>
                    </span>
                    <span>
                      <span className="sq-lozenge sq-lozenge--info">{inspector.stateLabel}</span>
                      <small>{s.since}: {inspector.sinceLabel}</small>
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
        <strong>{s.positionLegend}</strong>
      </footer>
    </div>
  );
}
