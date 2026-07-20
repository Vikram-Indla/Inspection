import React from "react";
export function WidgetFrame({ title, chrome, failed, fallback, children, className = "" }) {
  return <section className={["ax-surface ax-widget", failed && "is-failed", className].filter(Boolean).join(" ")}>
    <div className="ax-widget__head"><strong style={{ font: "var(--ax-text-subheading)" }}>{title}</strong>{chrome}</div>
    <div className="ax-widget__body">{children}</div>
    <div className="ax-widget__fallback ax-state ax-state--inline" style={{ flex: 1 }}>{fallback || <><span className="ax-state__glyph">⚠</span><p style={{ margin: 0 }}>Widget failed — other widgets unaffected.</p></>}</div>
  </section>;
}
