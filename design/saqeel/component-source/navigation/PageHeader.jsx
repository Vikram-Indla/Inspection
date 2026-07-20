import React from "react";
export function PageHeader({ breadcrumb, title, meta, actions, tabs }) {
  return (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      {breadcrumb}
      <div className="page-header">
        <div className="stack" style={{ gap: "var(--space-1)" }}>
          <h2 className="t-page-title">{title}</h2>
          {meta && <div className="row t-meta" style={{ flexWrap: "wrap" }}>{meta}</div>}
        </div>
        {actions && <div className="row">{actions}</div>}
      </div>
      {tabs}
    </div>
  );
}