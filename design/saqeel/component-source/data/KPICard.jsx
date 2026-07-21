import React from "react";
export function KPICard({ label, value, delta, deltaDirection, caption, tone }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={tone ? { color: "var(--status-" + tone + "-text)" } : undefined}>{value}</span>
      {(delta || caption) && (
        <span className={"kpi-delta " + (deltaDirection === "up" ? "up" : deltaDirection === "down" ? "down" : "")}>
          {delta}{caption && <span className="t-caption">{caption}</span>}
        </span>
      )}
    </div>
  );
}