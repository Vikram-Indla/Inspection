"use client";

// SAQEEL National Decision Canvas — the map-led primary panel.
//
// Reuses the shared GeoMap (Mapbox GL) renderer via next/dynamic ssr:false
// (same canon as OpsMap / GisStudio). No synthetic roads, routes or traffic are
// drawn: only governed official factory coordinates and provenance-tagged tone.
// The layer switcher toggles between the tone dimensions we can HONESTLY render
// (Compliance band, Risk band). Dimensions whose source/policy is blocked are
// shown disabled — never a fabricated choropleth. Selecting a region on the
// ranked-intervention rail cross-filters the map (and vice-versa).

import { Suspense, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import EmptyState from "@/components/EmptyState";
import styles from "./dashboard.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type CanvasMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  region: string | null;
  href: string;
  toneRisk: GeoTone;
  toneCompliance: GeoTone;
};

export type CanvasLayer = { id: "compliance" | "risk"; label: string; available: boolean };

export type CanvasRankRow = {
  key: string;
  name: string;
  detail: string;
  value: string;
  tone: "critical" | "warning" | "success" | "info" | "neutral";
};

export type DecisionCanvasStrings = {
  panelTitle: string;
  rankTitle: string;
  syncedToMap: string;
  provider: string;
  loadingTitle: string;
  loadingBody: string;
  emptyTitle: string;
  emptyBody: string;
  legendTitle: string;
  legendHealthy: string;
  legendAttention: string;
  legendCritical: string;
  provenance: string;
  open: string;
  allRegions: string;
  blockedLayer: string;
  selectedFactory: string;
};

const KSA_CENTER: [number, number] = [23.8859, 45.0792]; // GeoMap center is [lat, lng]
const KSA_ZOOM = 5;

export default function DecisionCanvas({
  markers,
  layers,
  ranking,
  strings: s,
}: {
  markers: CanvasMarker[];
  layers: CanvasLayer[];
  ranking: CanvasRankRow[];
  strings: DecisionCanvasStrings;
}) {
  const [layer, setLayer] = useState<"compliance" | "risk">(
    layers.find((l) => l.available)?.id ?? "risk",
  );
  const [region, setRegion] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const shown = useMemo(
    () => (region ? markers.filter((m) => m.region === region) : markers),
    [markers, region],
  );

  const geoMarkers: GeoMarkerData[] = useMemo(
    () =>
      shown.map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        label: m.label,
        tone: layer === "compliance" ? m.toneCompliance : m.toneRisk,
      })),
    [shown, layer],
  );

  const focus = useMemo(() => {
    if (!shown.length) return undefined;
    if (!region) return undefined;
    const lat = shown.reduce((a, m) => a + m.lat, 0) / shown.length;
    const lng = shown.reduce((a, m) => a + m.lng, 0) / shown.length;
    return { lat, lng, zoom: 6.5 };
  }, [shown, region]);

  const selected = shown.find((m) => m.id === selectedId) ?? null;

  return (
    <div className={styles.canvasGrid}>
      <section className={styles.mapPanel} aria-label={s.panelTitle}>
        <div className={styles.mapChrome}>
          <h3 className={styles.mapTitle}>{s.panelTitle}</h3>
          <div className={styles.seg} role="group" aria-label={s.panelTitle}>
            {layers.map((l) => (
              <button
                key={l.id}
                type="button"
                className={styles.segOpt}
                aria-pressed={layer === l.id}
                aria-disabled={!l.available}
                disabled={!l.available}
                title={l.available ? undefined : s.blockedLayer}
                onClick={() => l.available && setLayer(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <span className={styles.grow} />
          <span className={styles.idCode}>{s.provider}</span>
        </div>
        <div className={styles.mapScene}>
          {geoMarkers.length ? (
            <Suspense
              fallback={<EmptyState glyph="…" title={s.loadingTitle} body={s.loadingBody} bare role="status" ariaBusy />}
            >
              <GeoMap
                center={KSA_CENTER}
                zoom={KSA_ZOOM}
                markers={geoMarkers}
                selectedId={selectedId}
                focus={focus}
                onMarkerClick={setSelectedId}
                height="100%"
                ariaLabel={s.panelTitle}
              />
            </Suspense>
          ) : (
            <EmptyState glyph="◍" title={s.emptyTitle} body={s.emptyBody} bare role="status" />
          )}
          <div className={styles.mapLegend}>
            <div className={styles.legendTitle}>{s.legendTitle}</div>
            <div className={styles.legendRow}><span className={`${styles.swatch} ${styles.swLow}`} />{s.legendHealthy}</div>
            <div className={styles.legendRow}><span className={`${styles.swatch} ${styles.swMed}`} />{s.legendAttention}</div>
            <div className={styles.legendRow}><span className={`${styles.swatch} ${styles.swHigh}`} />{s.legendCritical}</div>
            <div className={styles.legendNote}>{s.provenance}</div>
          </div>
          {selected && (
            <div className={styles.selectedContext} role="status">
              <div className={styles.idCode}>{s.selectedFactory}</div>
              <strong>{selected.label}</strong>
              <a className={`${styles.btn} ${styles.btnSecondary}`} href={selected.href}>{s.open}</a>
            </div>
          )}
        </div>
      </section>

      <section className={styles.panel} aria-label={s.rankTitle}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>{s.rankTitle}</h3>
          <span className={styles.idCode}>{s.syncedToMap}</span>
        </div>
        <div className={styles.rankList}>
          <button
            type="button"
            className={`${styles.rankRow} ${region === null ? styles.rankActive : ""}`}
            aria-pressed={region === null}
            onClick={() => { setRegion(null); setSelectedId(null); }}
          >
            <span className={`${styles.exc} ${styles.tone_info}`}><span className={styles.excMark} /></span>
            <span className={styles.rankBody}><span className={styles.rankName}>{s.allRegions}</span></span>
          </button>
          {ranking.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`${styles.rankRow} ${region === r.name ? styles.rankActive : ""}`}
              aria-pressed={region === r.name}
              onClick={() => { setRegion(r.name); setSelectedId(null); }}
            >
              <span className={`${styles.exc} ${styles[`tone_${r.tone}`]}`}><span className={styles.excMark} /></span>
              <span className={styles.rankBody}>
                <span className={styles.rankName}>{r.name}</span>
                <span className={styles.rankDetail}>{r.detail}</span>
              </span>
              <span className={`${styles.idCode} ${styles[`tone_${r.tone}`]}`}>{r.value}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
