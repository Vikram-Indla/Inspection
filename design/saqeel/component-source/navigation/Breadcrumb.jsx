import React from "react";
export function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep" aria-hidden="true">/</span>}
          {i < items.length - 1 && it.href != null
            ? <a href={it.href} onClick={it.onClick}>{it.label}</a>
            : <span aria-current="page" style={{ color: "var(--text-secondary)" }}>{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}