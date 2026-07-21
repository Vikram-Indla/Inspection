import React from "react";
import { Breadcrumb } from "../process/Breadcrumb.jsx";
export function PageHeader({ breadcrumb, title, chips, reference, actions, className = "" }) {
  return <div className={className} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {breadcrumb ? <Breadcrumb items={breadcrumb} /> : null}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
      <h1 style={{ margin: 0, font: "500 24px/32px var(--ax-font-sans)" }}>{title}</h1>
      {reference ? <span className="ax-numeric" style={{ font: "500 13px/18px var(--ax-font-mono)", color: "var(--ax-color-text-secondary)" }}><bdi>{reference}</bdi></span> : null}
    </div>
    {(chips || actions) ? <div className="ax-row" style={{ justifyContent: "space-between" }}><span className="ax-row">{chips}</span><span className="ax-row">{actions}</span></div> : null}
  </div>;
}
