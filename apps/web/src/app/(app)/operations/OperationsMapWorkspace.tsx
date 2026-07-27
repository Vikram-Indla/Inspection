"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import type { GeoMarkerData } from "@/components/GeoMap";
import type { OpsPin } from "./OpsMap";
import OperationsPreview, {
  type OperationsPreviewEntry,
  type OperationsPreviewStrings,
} from "./OperationsPreview";
import styles from "./operations.module.css";

export type OperationsMapEntry = OpsPin & OperationsPreviewEntry;

export type OperationsMapWorkspaceStrings = {
  mapLabel: string;
  loadingTitle: string;
  loadingBody: string;
  listHeading: string;
  listDescription: string;
  emptyTitle: string;
  emptyBody: string;
  open: string;
  selected: string;
  factory: string;
  visit: string;
  preview: string;
  previewStrings: OperationsPreviewStrings;
};

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });
const KSA_CENTER: [number, number] = [23.8859, 45.0792];

export default function OperationsMapWorkspace({
  entries,
  strings: s,
  mapOnly = false,
}: {
  entries: OperationsMapEntry[];
  strings: OperationsMapWorkspaceStrings;
  mapOnly?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const selected = entries.find(entry => entry.id === selectedId) ?? null;
  const preview = entries.find(entry => entry.id === previewId) ?? null;
  const markers = useMemo<GeoMarkerData[]>(() => entries.map(entry => ({
    id: entry.id,
    lat: entry.lat,
    lng: entry.lng,
    label: entry.label,
    tone: entry.tone,
    radiusM: entry.radiusM,
  })), [entries]);
  const selectFromMap = useCallback((id: string) => {
    setSelectedId(id);
    setPreviewId(id);
  }, []);

  if (entries.length === 0) {
    return <EmptyState bare title={s.emptyTitle} body={s.emptyBody} />;
  }

  return (
    <div className={`${styles.workspace} ${mapOnly ? styles.workspaceMapOnly : ""}`}>
      <section className={styles.mapFrame} aria-label={s.mapLabel}>
        <Suspense fallback={
          <EmptyState bare role="status" ariaBusy title={s.loadingTitle} body={s.loadingBody} />
        }>
          <GeoMap
            center={KSA_CENTER}
            zoom={5}
            markers={markers}
            selectedId={selectedId}
            onMarkerClick={selectFromMap}
            height="100%"
          />
        </Suspense>
      </section>

      {!mapOnly && <section className={styles.mapList} aria-labelledby="operations-map-list-heading">
        <div className={styles.mapListHeader}>
          <div>
            <h4 id="operations-map-list-heading">{s.listHeading}</h4>
            <p className="sq-caption">{s.listDescription}</p>
          </div>
          <span className="sq-lozenge sq-numeric">{entries.length}</span>
        </div>
        <ul className={styles.mapListItems}>
          {entries.map(entry => (
            <li key={entry.id}>
              <button
                className={styles.mapListButton}
                type="button"
                aria-pressed={selectedId === entry.id}
                data-entry-kind={entry.kind}
                data-has-inspector={entry.inspectorName ? "true" : "false"}
                onClick={() => {
                  setSelectedId(entry.id);
                  setPreviewId(entry.id);
                }}
              >
                <span>
                  <strong>{entry.label}</strong><br />
                  <span className="sq-caption">
                    {[entry.region, entry.city].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <span className="sq-lozenge">{entry.state}</span>
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className={styles.selectionCard} role="status" aria-live="polite">
            <p className="sq-caption">{s.selected}</p>
            <p><strong>{selected.label}</strong></p>
            <div className="sq-row" style={{ flexWrap: "wrap" }}>
              <button className="sq-btn sq-btn--secondary" type="button" onClick={() => setPreviewId(selected.id)}>
                {s.preview}
              </button>
              <a className="sq-link" href={selected.href}>
                {s.open} {selected.kind === "visit" ? s.visit : s.factory}
              </a>
            </div>
          </div>
        )}
      </section>}
      <OperationsPreview entry={preview} strings={s.previewStrings} onClose={() => setPreviewId(null)} />
    </div>
  );
}
