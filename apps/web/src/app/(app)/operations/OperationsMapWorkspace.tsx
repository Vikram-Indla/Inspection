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

// M3-MAP-PROVENANCE-001 — list-capable: an entry may have no resolvable
// coordinate at all (tier 3, "unavailable") and must still render in the
// synchronized list. lat/lng are therefore nullable here even though the
// shared OpsPin/GeoMap contract underneath still requires real numbers —
// mappedEntries (below) is the type-guarded subset that satisfies that.
export type OperationsPositionProvenance = "recorded" | "projected" | "unavailable";
export type OperationsMapEntry = Omit<OpsPin, "lat" | "lng"> & OperationsPreviewEntry & {
  lat: number | null;
  lng: number | null;
  provenance: OperationsPositionProvenance;
  observedAt?: string;
  accuracyM?: number;
  scheduledAt?: string;
  coordinateSource?: "planner" | "factory";
};

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
  provenanceRecorded: string;
  provenanceProjected: string;
  provenanceUnavailable: string;
};

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });
const KSA_CENTER: [number, number] = [23.8859, 45.0792];

export default function OperationsMapWorkspace({
  entries,
  strings: s,
}: {
  entries: OperationsMapEntry[];
  strings: OperationsMapWorkspaceStrings;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const selected = entries.find(entry => entry.id === selectedId) ?? null;
  const preview = entries.find(entry => entry.id === previewId) ?? null;
  // M3-MAP-PROVENANCE-001 — the map surface may only ever receive a real
  // coordinate; a tier-3 (unavailable) entry has no pin, but stays in the
  // full `entries` list below (never dropped). Filtering here, not upstream,
  // is what keeps null/NaN from ever reaching the shared GeoMap component.
  const mappedEntries = useMemo(
    () => entries.filter((entry): entry is OperationsMapEntry & { lat: number; lng: number } =>
      entry.lat != null && entry.lng != null),
    [entries],
  );
  const markers = useMemo<GeoMarkerData[]>(() => mappedEntries.map(entry => ({
    id: entry.id,
    lat: entry.lat,
    lng: entry.lng,
    label: entry.label,
    tone: entry.tone,
    radiusM: entry.radiusM,
  })), [mappedEntries]);
  const provenanceLabel = useCallback((entry: OperationsMapEntry) => {
    if (entry.kind !== "visit") return null;
    if (entry.provenance === "recorded") {
      return `${s.provenanceRecorded}${entry.observedAt ? ` — ${new Date(entry.observedAt).toLocaleString()}` : ""}`;
    }
    if (entry.provenance === "projected") {
      return `${s.provenanceProjected}${entry.scheduledAt ? ` — ${new Date(entry.scheduledAt).toLocaleString()}` : ""}`;
    }
    return s.provenanceUnavailable;
  }, [s.provenanceRecorded, s.provenanceProjected, s.provenanceUnavailable]);
  const selectFromMap = useCallback((id: string) => {
    setSelectedId(id);
    setPreviewId(id);
  }, []);

  if (entries.length === 0) {
    return <EmptyState bare title={s.emptyTitle} body={s.emptyBody} />;
  }

  return (
    <div className={styles.workspace}>
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

      <section className={styles.mapList} aria-labelledby="operations-map-list-heading">
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
                data-provenance={entry.kind === "visit" ? entry.provenance : undefined}
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
                  {entry.kind === "visit" && (
                    <>
                      <br />
                      <span className="sq-caption" data-testid="operations-entry-provenance">{provenanceLabel(entry)}</span>
                    </>
                  )}
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
      </section>
      <OperationsPreview entry={preview} strings={s.previewStrings} onClose={() => setPreviewId(null)} />
    </div>
  );
}
