import React from "react";
export function CommandHeader({ context, search, scope, action, utilities, account, className = "" }) {
  return <header className={"ax-texture-chrome " + className} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center", height: 60, padding: "0 32px", backgroundColor: "var(--ax-color-surface)", borderBottom: "1px solid var(--ax-color-border-control)" }}>
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><b lang="ar" style={{ font: "600 17px/1 var(--ax-font-arabic)" }}>صقيل</b>{context ? <span style={{ font: "400 13px/1 var(--ax-font-sans)", color: "var(--ax-color-text-secondary)", borderInlineStart: "1px solid var(--ax-color-border)", paddingInlineStart: 10 }}>{context}</span> : null}</span>
    <span style={{ minWidth: 0 }}>{search}</span>
    <span style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--ax-color-text-secondary)", font: "400 13px/1 var(--ax-font-sans)" }}>{scope}{action}{utilities}{account}</span>
  </header>;
}
