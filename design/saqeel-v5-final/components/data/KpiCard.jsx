import React from "react";
// V4.1: ordinary KPI values use the 28/32 metric token; no bordered card — compose inside MetricStrip
// or a TonalField. Display 32/40 is reserved for one page-defining figure.
export function KpiCard({ label, value, delta, deltaDirection, trace, stale, className = "" }) {
  return <div className={["ax-kpi", stale && "is-stale", className].filter(Boolean).join(" ")} style={{ padding: 0 }}>
    <span className="ax-mstrip__label">{label}</span>
    <span style={{ font: "var(--ax-text-metric)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    {delta ? <span className={"ax-kpi__delta" + (deltaDirection === "up" ? " is-up" : deltaDirection === "down" ? " is-down" : "")}>{delta}</span> : null}
    {trace ? <a href={trace.href || "#"} className="ax-caption ax-link">{trace.label || "View records"}</a> : null}
  </div>;
}
