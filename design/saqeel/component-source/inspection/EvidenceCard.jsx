import React from "react";
export function EvidenceCard({ src, kind = "photo", caption, meta, onOpen, onRemove }) {
  return (
    <figure style={{ margin: 0, width: 132 }}>
      <button type="button" onClick={onOpen} style={{ display: "block", width: "100%", aspectRatio: "4/3", padding: 0,
        border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", overflow: "hidden",
        background: "var(--surface-sunken)", cursor: onOpen ? "zoom-in" : "default", position: "relative" }}>
        {src ? <img src={src} alt={caption || "Evidence"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <span style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--text-muted)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{kind === "photo" ? <><rect x="3" y="5" width="18" height="14" rx="1" /><circle cx="12" cy="12" r="3.5" /></> : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>}</svg>
            </span>}
        {onRemove && <span onClick={(e) => { e.stopPropagation(); onRemove(); }} role="button" aria-label="Remove"
          style={{ position: "absolute", insetBlockStart: 4, insetInlineEnd: 4, width: 20, height: 20, display: "grid", placeItems: "center",
            background: "var(--surface-overlay)", color: "#fff", borderRadius: "var(--radius-xs)", fontSize: 11 }}>✕</span>}
      </button>
      {(caption || meta) && <figcaption className="t-caption" style={{ marginBlockStart: 4 }}>{caption}{meta && <span style={{ display: "block", color: "var(--text-disabled)" }}>{meta}</span>}</figcaption>}
    </figure>
  );
}