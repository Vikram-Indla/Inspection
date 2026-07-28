"use client";

// SAQEEL metric strip + methodology drawer (client island).
//
// Renders already-prepared, localized MetricDisplay tiles (the value/formatting
// decision was made server-side from the shared contract — this component never
// computes a KPI). Each tile exposes a Methodology button that opens the metric
// lineage drawer built from the shared contract + immutable registry.

import { useEffect, useRef, useState } from "react";
import type { MetricDisplay, MethodologyEntry } from "./dashboard-format";

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
    <div className="kpi-grid" role="group" aria-label={s.methodology}>
      {metrics.map((m) => {
        const hasMethod = !!methodology[m.metricId];
        return (
          <article className="panel kpi" key={m.metricId}>
            <div className="kpi-label">{m.title}</div>
            {m.kind === "status" ? (
              <div className="badge badge-pending">{m.text}</div>
            ) : (
              <div className="kpi-value">{m.text}</div>
            )}
            {m.sub && <div className="kpi-delta">{m.sub}</div>}
            {hasMethod && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-haspopup="dialog"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setOpenId(m.metricId);
                }}
              >
                {m.kind === "status" ? s.why : s.methodology}
              </button>
            )}
          </article>
        );
      })}

      {entry && (
        <>
          <div
            ref={drawerRef}
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="method-title"
          >
            <div className="drawer-header">
              <div>
                <h2 id="method-title">{entry.title}</h2>
                <div className="id-code">{entry.formulaId}</div>
              </div>
              <button ref={closeRef} type="button" className="btn btn-secondary btn-icon" onClick={() => setOpenId(null)} aria-label={s.close}>✕</button>
            </div>
            <div className="drawer-body stack">
              {entry.blockedNote && (
                <div className="alert alert-warning" role="note">
                  <div><strong>{s.blockedTitle}</strong>: {entry.blockedNote}</div>
                </div>
              )}
              <dl className="panel">
                {entry.rows.map((row) => (
                  <div className="panel-row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {entry.drillRoute && (
              <div className="grid-footer">
                <a className="btn btn-secondary" href={entry.drillRoute}>{entry.drillLabel || s.drillFallback}</a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
