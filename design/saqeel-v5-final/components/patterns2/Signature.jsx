import React from "react";
export function Signature({ name, role, signed, timestamp, preview, className = "" }) {
  return <div className={"ax-sig-block " + className}>
    <span className="ax-field__label">{role}</span>
    <p style={{ margin: "2px 0 0", font: "500 15px/22px var(--ax-font-sans)" }}>{name} {signed ? <span className="ax-chip ax-chip--ok">Signed</span> : <span className="ax-chip">Unsigned</span>}</p>
    {preview || <div style={{ height: 56, borderBlockEnd: "1px solid var(--ax-color-border-strong)" }} aria-hidden="true"></div>}
    <p className="ax-numeric" style={{ margin: "4px 0 0", font: "var(--ax-text-caption)", color: "var(--ax-color-text-secondary)" }}>{timestamp}</p>
  </div>;
}
