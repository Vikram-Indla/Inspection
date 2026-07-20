import React from "react";
export function Timeline({ items = [], className = "" }) {
  return <ol className={"ax-timeline " + className}>
    {items.map((it, i) => <li key={i} className={it.key ? "is-key" : ""}>
      <div>
        <div><strong>{it.actor}</strong> {it.action}{it.version ? <> <span className="ax-version">{it.version}</span></> : null}</div>
        <div className="ax-timeline__meta">{it.time}</div>
        {it.detail ? <div className="ax-caption">{it.detail}</div> : null}
      </div>
    </li>)}
  </ol>;
}
