"use client";

// SAQEEL Executive Overview — regional assurance queue (client island).
//
// The queue used to live inside DecisionCanvas, which forced geography to be
// read before the regional position. The Executive Overview architecture puts
// the queue ahead of the map, but the two must stay cross-filtered: selecting a
// region here scopes the map below.
//
// So the region selection lifts to this component, which renders
// queue → children → map. `children` carries the server-rendered analytic
// panels through unchanged, which is how the queue sits above them and the map
// below without any of them becoming client components.
//
// Ordering law: worst-first by current approved compliance, rows whose rate is
// unavailable last. That is assurance triage, not a league table — the queue
// never ranks, awards or labels a region as failing, and always shows the
// eligible-answer denominator beside the rate.

import { useState, type ReactNode } from "react";
import DecisionCanvas, {
  type CanvasMarker,
  type CanvasLayer,
  type CanvasRankRow,
  type DecisionCanvasStrings,
} from "./DecisionCanvas";
import styles from "./dashboard.module.css";

export type RegionalScopeStrings = {
  queueTitle: string;
  queueMeta: string;
  allRegions: string;
  noTargetNote: string;
};

export default function RegionalScope({
  ranking,
  markers,
  layers,
  canvasStrings,
  strings: s,
  children,
}: {
  ranking: CanvasRankRow[];
  markers: CanvasMarker[];
  layers: CanvasLayer[];
  canvasStrings: DecisionCanvasStrings;
  strings: RegionalScopeStrings;
  children?: ReactNode;
}) {
  const [region, setRegion] = useState<string | null>(null);

  return (
    <>
      <section className={styles.panel} aria-label={s.queueTitle}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>{s.queueTitle}</h3>
          <span className={styles.idCode}>{s.queueMeta}</span>
        </div>
        <div className={styles.rankList}>
          <button
            type="button"
            className={`${styles.rankRow} ${region === null ? styles.rankActive : ""}`}
            aria-pressed={region === null}
            onClick={() => setRegion(null)}
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
              onClick={() => setRegion(r.name)}
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
        <p className={styles.queueNote}>{s.noTargetNote}</p>
      </section>

      {children}

      <DecisionCanvas
        markers={markers}
        layers={layers}
        region={region}
        onRegionChange={setRegion}
        strings={canvasStrings}
      />
    </>
  );
}
