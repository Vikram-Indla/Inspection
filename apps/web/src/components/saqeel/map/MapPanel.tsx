"use client";
import React from "react";

export interface MapPanelProps {
  title?: React.ReactNode;
  /** inline-start or inline-end edge (RTL-aware) */
  position?: "start" | "end";
  width?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}

/* Floating panel for anything that sits ON the map: toolbar, legend,
   layer control, selected-zone/inspection context. */
export function MapPanel({ title, children, position = "start", width = 280, onClose }: MapPanelProps) {
  return (
    <div
      className="map-panel"
      style={{
        width,
        position: "absolute",
        insetBlockStart: "var(--space-3)",
        [position === "start" ? "insetInlineStart" : "insetInlineEnd"]: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100% - 2 * var(--space-3))",
      }}
    >
      {title && (
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            padding: "var(--space-2) var(--space-3)",
            borderBlockEnd: "1px solid var(--border-subtle)",
          }}
        >
          <span className="t-heading">{title}</span>
          {onClose && (
            <button className="btn btn-ghost btn-sm btn-icon" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      )}
      <div style={{ padding: "var(--space-3)", overflow: "auto" }}>{children}</div>
    </div>
  );
}

export interface MapLegendItem {
  label: string;
  tone?: string;
}

export function MapLegend({ items = [] }: { items?: MapLegendItem[] }) {
  return (
    <div className="stack" style={{ gap: "var(--space-1)" }}>
      {items.map((it, i) => (
        <div key={i} className="map-legend-row">
          <span className="swatch" style={{ background: "var(--status-" + (it.tone || "info") + ")" }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

export interface MapLayer {
  id: string;
  label: string;
  on?: boolean;
}

export function MapLayerControl({ layers = [], onToggle }: { layers?: MapLayer[]; onToggle?: (id: string) => void }) {
  return (
    <div className="stack" style={{ gap: "var(--space-2)" }}>
      {layers.map((l) => (
        <label key={l.id} className="switch" style={{ justifyContent: "space-between", width: "100%" }}>
          <span>{l.label}</span>
          <input type="checkbox" role="switch" checked={l.on} onChange={() => onToggle && onToggle(l.id)} />
        </label>
      ))}
    </div>
  );
}
