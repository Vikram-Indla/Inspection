import React from "react";
export function MetricStrip({ items = [], className = "" }) {
  return <div className={"ax-mstrip ax-numeric " + className}>
    {items.map((m, i) => <div key={i}>
      <div className="ax-mstrip__label">{m.label}</div>
      <div className="ax-mstrip__value" style={m.tone ? { color: `var(--ax-color-${m.tone}-strong)` } : undefined}>{m.value}</div>
      {m.sub ? <div className="ax-mstrip__sub">{m.sub}</div> : null}
    </div>)}
  </div>;
}
