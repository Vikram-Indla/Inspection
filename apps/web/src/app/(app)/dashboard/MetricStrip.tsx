"use client";

// SAQEEL metric strip + methodology drawer (client island).
//
// Renders already-prepared, localized MetricDisplay tiles (the value/formatting
// decision was made server-side from the shared contract — this component never
// computes a KPI). Each tile exposes a Methodology button that opens the metric
// lineage drawer built from the shared contract + immutable registry.

import { useEffect, useRef, useState } from "react";
import type { MetricDisplay, MethodologyEntry } from "./dashboard-format";
import styles from "./dashboard.module.css";

export type MetricStripStrings = {
  methodology: string;
  why: string;
  close: string;
  advisory: string;
  blockedTitle: string;
  drillFallback: string;
};

export default function MetricStrip({
  metrics,
  methodology,
  strings: s,
}: {
  metrics: MetricDisplay[];
  methodology: Record<string, MethodologyEntry>;
  strings: MetricStripStrings;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
  const entry = openId ? methodology[openId] : null;

  useEffect(() => {
    if (!entry) {
      if (wasOpenRef.current) openerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
      if (e.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entry]);

  return (
    <div className={styles.metricStrip} role="group" aria-label={s.methodology}>
      {metrics.map((m) => {
        const hasMethod = !!methodology[m.metricId];
        return (
          <div className={styles.metricTile} key={m.metricId}>
            <div className={styles.kpiLabel}>{m.title}</div>
            {m.kind === "status" ? (
              <div className={`${styles.statusChip} ${styles[`tone_${m.tone}`]}`}>
                <span className={styles.dot} aria-hidden="true" />
                {m.text}
              </div>
            ) : (
              <div className={`${styles.kpiValue} ${styles[`tone_${m.tone}`]}`}>{m.text}</div>
            )}
            {m.sub && <div className={styles.kpiDelta}>{m.sub}</div>}
            {hasMethod && (
              <button
                type="button"
                className={styles.methodBtn}
                aria-haspopup="dialog"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setOpenId(m.metricId);
                }}
              >
                {m.kind === "status" ? s.why : s.methodology}
              </button>
            )}
          </div>
        );
      })}

      {entry && (
        <>
          <div className={styles.scrim} onClick={() => setOpenId(null)} aria-hidden="true" />
          <div
            ref={drawerRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="method-title"
          >
            <div className={styles.drawerHead}>
              <div>
                <div id="method-title" className={styles.drawerTitle}>{entry.title}</div>
                <div className={styles.idCode}>{entry.formulaId}</div>
              </div>
              <button ref={closeRef} type="button" className={styles.methodClose} onClick={() => setOpenId(null)} aria-label={s.close}>✕</button>
            </div>
            <div className={styles.drawerBody}>
              {entry.blockedNote && (
                <div className={`${styles.statusChip} ${styles.tone_warning} ${styles.drawerBlocked}`} role="note">
                  <span className={styles.dot} aria-hidden="true" />
                  <span>{s.blockedTitle}: {entry.blockedNote}</span>
                </div>
              )}
              <dl className={styles.methodList}>
                {entry.rows.map((row) => (
                  <div className={styles.methodRow} key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {entry.drillRoute && (
              <div className={styles.drawerFoot}>
                <a className={`${styles.btn} ${styles.btnSecondary}`} href={entry.drillRoute}>{entry.drillLabel || s.drillFallback}</a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
