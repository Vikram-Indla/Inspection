import React from "react";
export function Menu({ items = [], className = "", style }) {
  return <div className={"ax-menu " + className} role="menu" style={style}>
    {items.map((it, i) => <button key={i} role="menuitem" className={it.danger ? "is-danger" : ""} aria-disabled={it.disabled || undefined} title={it.disabled ? it.disabledReason : undefined} onClick={it.disabled ? undefined : it.onClick}>
      {it.icon}{it.label}{it.disabled ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" style={{ marginInlineStart: "auto" }}><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg> : null}
    </button>)}
  </div>;
}
