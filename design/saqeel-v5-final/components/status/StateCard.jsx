import React from "react";
export function StateCard({ glyph = "○", title, children, action, inline, unauthorized, className = "" }) {
  return <div className={["ax-state", inline && "ax-state--inline", unauthorized && "ax-permission", className].filter(Boolean).join(" ")}>
    <span className="ax-state__glyph" aria-hidden="true">{glyph}</span>
    {title ? <h4>{title}</h4> : null}
    {children ? <p style={{ margin: 0 }}>{children}</p> : null}
    {action}
  </div>;
}
