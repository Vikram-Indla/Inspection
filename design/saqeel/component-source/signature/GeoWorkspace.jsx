import React from "react";
import { MapToolbar, MapZoom } from "../map/MapToolbar.jsx";
import { MapPanel, MapLegend, MapLayerControl } from "../map/MapPanel.jsx";
/* SAQEEL signature: Geospatial Command Workspace — the composed map surface:
   untinted basemap slot + toolbar + layers/legend + selected-context panel
   + optional operational drawer. The map stays visually central. */
export function GeoWorkspace({ basemap, toolbar, layers, legendItems = [], onToggleLayer,
  contextPanel, drawer, zoom = {}, state }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "var(--surface-sunken)" }}>
      <div style={{ position: "absolute", inset: 0 }}>{basemap}</div>
      {state === "loading" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div className="map-panel" style={{ padding: "var(--space-3) var(--space-5)" }}><span className="t-compact">Loading operational layers…</span></div></div>}
      {state === "restricted" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "var(--surface-overlay)" }}><div className="map-panel empty" style={{ padding: "var(--space-6)" }}><div className="empty-title">Restricted area</div><p>Your role does not include this zone.</p></div></div>}
      {state === "empty" && <div style={{ position: "absolute", insetBlockEnd: "var(--space-6)", insetInlineStart: "50%", transform: "translateX(-50%)" }}><div className="map-panel" style={{ padding: "var(--space-2) var(--space-4)" }}><span className="t-compact">No inspections match the current filters</span></div></div>}
      {toolbar || <MapToolbar />}
      {(layers || legendItems.length > 0) && (
        <MapPanel position="end" width={200} title="Layers">
          {layers && <MapLayerControl layers={layers} onToggle={onToggleLayer} />}
          {legendItems.length > 0 && <><hr className="divider" style={{ marginBlock: "var(--space-2)" }} /><MapLegend items={legendItems} /></>}
        </MapPanel>
      )}
      {contextPanel}
      <MapZoom {...zoom} />
      {drawer}
    </div>
  );
}