import React from "react";

export type MarkerTone = "critical" | "major" | "warning" | "compliant" | "info" | "pending";

const paths: Record<string, React.ReactNode> = {
  facility: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />,
  vehicle: (
    <>
      <path d="M3 17h1m16 0h1M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0m8 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
      <path d="M5 17V8h9l4 4h3v5" />
    </>
  ),
  inspector: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </>
  ),
  zone: <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11" />,
};

export interface MapMarkerProps {
  kind?: "facility" | "vehicle" | "inspector" | "zone";
  /** status colour carries meaning — matches StatusBadge semantics */
  tone?: MarkerTone;
  label?: string;
  selected?: boolean;
}

export function MapMarker({ kind = "facility", tone = "info", label, selected }: MapMarkerProps) {
  return (
    <span
      className="map-marker"
      title={label}
      style={{
        background: "var(--status-" + tone + ")",
        outline: selected ? "2px solid var(--focus-ring)" : "none",
        outlineOffset: 2,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {paths[kind]}
      </svg>
    </span>
  );
}

export interface MapClusterProps {
  count: number;
  tone?: MarkerTone;
}

export function MapCluster({ count, tone }: MapClusterProps) {
  return (
    <span className="map-cluster" style={tone ? { background: "var(--status-" + tone + ")" } : undefined}>
      {count}
    </span>
  );
}
