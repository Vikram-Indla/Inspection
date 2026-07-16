"use client";
// M08-002 — KSA operations map. Active-visit pins toned by operational_state,
// factory positions as neutral pins; clicking a pin surfaces a link to the
// visit (or factory dossier). GeoMap is Mapbox GL JS (browser-only), so it
// loads via next/dynamic ssr:false — the dynamic() call must live in a client
// component (same canon as admin/gis/GisStudio.tsx and field/[visitId]).
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";

export type OpsPin = {
  id: string;                 // "v:<visitId>" | "f:<factoryId>"
  kind: "visit" | "factory";
  lat: number;
  lng: number;
  label: string;
  tone: GeoTone;
  /** Geofence ring (factories.geofence_radius_m ?? ENG-06 gis default) — active visits only. */
  radiusM?: number;
  href: string;               // /visits/{id} or /factories/{id}
};

export type OpsMapStrings = {
  loadingTitle: string;
  loadingBody: string;
  open: string;
  selectHint: string;
  legendExecuting: string;
  legendEnRoute: string;
  legendFactory: string;
};

// KSA framing — country-level view (Riyadh-centered).
const KSA_CENTER: [number, number] = [23.8859, 45.0792];
const KSA_ZOOM = 5;

export default function OpsMap({ pins, strings: s }: { pins: OpsPin[]; strings: OpsMapStrings }) {
  const GeoMap = useMemo(() => dynamic(() => import("@/components/GeoMap"), {
    ssr: false,
    loading: () => (
      <div className="ax-state">
        <span className="ax-state__glyph">…</span><h4>{s.loadingTitle}</h4>
        <p className="ax-caption">{s.loadingBody}</p>
      </div>
    ),
  }), [s.loadingTitle, s.loadingBody]);

  const [selectedId, setSelectedId] = useState(null as string | null);
  const selected = pins.find(p => p.id === selectedId) ?? null;
  const markers: GeoMarkerData[] = pins.map(p => ({
    id: p.id, lat: p.lat, lng: p.lng, label: p.label, tone: p.tone, radiusM: p.radiusM,
  }));

  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-150)" }}>
      <div style={{ blockSize: 380, borderRadius: "var(--ax-radius-200)", overflow: "hidden" }}>
        <GeoMap center={KSA_CENTER} zoom={KSA_ZOOM} markers={markers}
          selectedId={selectedId} onMarkerClick={setSelectedId} height="100%" />
      </div>
      <div className="ax-row" style={{ gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <span className="ax-caption">
          <span className="ax-lozenge ax-lozenge--success">{s.legendExecuting}</span>{" "}
          <span className="ax-lozenge ax-lozenge--warning">{s.legendEnRoute}</span>{" "}
          <span className="ax-lozenge">{s.legendFactory}</span>
        </span>
        {selected
          ? <a className="ax-link" href={selected.href}>{s.open} — {selected.label}</a>
          : <span className="ax-caption">{s.selectHint}</span>}
      </div>
    </div>
  );
}
