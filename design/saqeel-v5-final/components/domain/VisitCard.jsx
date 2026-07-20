import React from "react";
export function VisitCard({ title, status, meta = [], actions, className = "" }) {
  return <div className={"ax-surface ax-panel ax-visitcard " + className}>
    <div className="ax-visitcard__row"><strong style={{ font: "var(--ax-text-subheading)" }}>{title}</strong>{status}</div>
    {meta.length ? <dl className="ax-visitcard__meta" style={{ margin: 0 }}>{meta.map((mm, i) => <div key={i}><dt>{mm.label}</dt><dd>{mm.value}</dd></div>)}</dl> : null}
    {actions ? <div className="ax-visitcard__row">{actions}</div> : null}
  </div>;
}
