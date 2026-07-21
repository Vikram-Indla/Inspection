import React from "react";
export function Progress({ value = 0, max = 100, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="stack" style={{ gap: "var(--space-1)" }}>
      {label && <div className="row" style={{ justifyContent: "space-between" }}><span className="t-label">{label}</span><span className="t-meta" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(pct)}%</span></div>}
      <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <i style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}