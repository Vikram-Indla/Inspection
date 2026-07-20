import React from "react";
export function Timeline({ items = [] }) {
  return (
    <ol className="timeline">
      {items.map((it, i) => (
        <li key={i}>
          <span className={"tl-dot" + (it.accent ? " is-accent" : "")} style={it.tone ? { background: "var(--status-" + it.tone + ")" } : undefined} />
          <div className="tl-title">{it.title}</div>
          {it.detail && <div className="t-compact" style={{ color: "var(--text-secondary)" }}>{it.detail}</div>}
          <div className="tl-meta">{[it.actor, it.time].filter(Boolean).join(" · ")}</div>
        </li>
      ))}
    </ol>
  );
}