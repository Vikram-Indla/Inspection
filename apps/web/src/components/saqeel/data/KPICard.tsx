import React from "react";

export interface KPICardProps {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaDirection?: "up" | "down";
  caption?: string;
  /** tint the value with a status colour when the number itself is a state */
  tone?: "critical" | "warning" | "compliant";
}

export function KPICard({ label, value, delta, deltaDirection, caption, tone }: KPICardProps) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={tone ? { color: "var(--status-" + tone + "-text)" } : undefined}>
        {value}
      </span>
      {(delta || caption) && (
        <span className={"kpi-delta " + (deltaDirection === "up" ? "up" : deltaDirection === "down" ? "down" : "")}>
          {delta}
          {caption && <span className="t-caption">{caption}</span>}
        </span>
      )}
    </div>
  );
}
