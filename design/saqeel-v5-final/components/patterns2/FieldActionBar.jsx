import React from "react";
export function FieldActionBar({ items = [], primary, className = "" }) {
  return <nav className={"ax-field-taskbar " + className} aria-label="Field tasks">
    {items.map((it, i) => <a key={i} className="ax-field-taskbar__item" aria-current={it.current ? "page" : undefined} href={it.href || "#"} onClick={it.onClick}>{it.label}</a>)}
    {primary ? <a className="ax-field-taskbar__primary" href={primary.href || "#"} onClick={primary.onClick}>{primary.label}</a> : null}
  </nav>;
}
