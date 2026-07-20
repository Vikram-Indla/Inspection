import React from "react";
export function MapToolbar({ search, filters, actions }) {
  return (
    <div className="map-panel row" style={{ position: "absolute", insetBlockStart: "var(--space-3)", insetInlineStart: "50%",
      transform: "translateX(-50%)", padding: "var(--space-1)", gap: "var(--space-1)" }}>
      {search}{filters}{actions}
    </div>
  );
}
export function MapZoom({ onIn, onOut, onLocate }) {
  return (
    <div className="map-panel" style={{ position: "absolute", insetBlockEnd: "var(--space-3)", insetInlineEnd: "var(--space-3)",
      display: "flex", flexDirection: "column", padding: 2, gap: 2 }}>
      <button className="btn btn-ghost btn-sm btn-icon" aria-label="Zoom in" onClick={onIn}>+</button>
      <button className="btn btn-ghost btn-sm btn-icon" aria-label="Zoom out" onClick={onOut}>−</button>
      {onLocate && <button className="btn btn-ghost btn-sm btn-icon" aria-label="Current location" onClick={onLocate}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg></button>}
    </div>
  );
}