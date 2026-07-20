import React from "react";
export function Breadcrumb({ items = [], className = "" }) {
  return <ol className={"ax-breadcrumb " + className}>
    {items.map((it, i) => <li key={i}>{it.href && i < items.length - 1 ? <a href={it.href} style={{ color: "inherit" }}>{it.label}</a> : <span aria-current={i === items.length - 1 ? "page" : undefined}>{it.label}</span>}</li>)}
  </ol>;
}
