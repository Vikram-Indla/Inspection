import React from "react";

export interface MetricStripProps {
  items?: Array<{ label: string; value: React.ReactNode; tone?: "critical" | "warning" | "compliant" }>;
}

export function MetricStrip({ items = [] }: MetricStripProps) {
  return (
    <div className="metric-strip">
      {items.map((m, i) => (
        <div key={i} className="stack" style={{ gap: 2 }}>
          <span className="kpi-label">{m.label}</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: m.tone ? "var(--status-" + m.tone + "-text)" : undefined,
            }}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
