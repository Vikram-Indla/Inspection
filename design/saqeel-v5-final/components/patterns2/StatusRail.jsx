import React from "react";
export function StatusRail({ items = [], end, label = "Record status", className = "" }) {
  return <div className={"ax-statusrail " + className} role="navigation" aria-label={label}>
    {items.map((it, i) => <span key={i}>{it.label ? <>{it.label} </> : null}<b style={it.tone ? { color: `var(--ax-color-${it.tone}-strong)` } : undefined}>{it.value}</b></span>)}
    {end ? <span style={{ marginInlineStart: "auto" }}>{end}</span> : null}
  </div>;
}
