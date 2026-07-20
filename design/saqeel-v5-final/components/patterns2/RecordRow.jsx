import React from "react";
export function RecordRow({ title, chips, meta, selected, onClick, className = "" }) {
  return <button type="button" className={"ax-recordrow " + className} aria-selected={selected || undefined} onClick={onClick}>
    <strong>{title}</strong>{chips}<span className="ax-recordrow__meta" style={{ marginInlineStart: "auto" }}>{meta}</span>
  </button>;
}
