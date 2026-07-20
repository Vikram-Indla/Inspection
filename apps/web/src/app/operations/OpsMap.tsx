"use client";
// M08-002 — KSA operations map. Active-visit pins toned by operational_state,
// factory positions as neutral pins; clicking a pin surfaces a link to the
// visit (or factory dossier). GeoMap is Mapbox GL JS (browser-only), so it
// loads via next/dynamic ssr:false — the dynamic() call must live in a client
// component (same canon as admin/gis/GisStudio.tsx and field/[visitId]).
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData, GeoTone } from "@/components/GeoMap";
import EmptyState from "@/components/EmptyState";

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

// Module scope, not inside the component: next/dynamic must be called once
// at module load. Calling it inside a component/hook (even memoized)
// re-registers the same chunk on every remount — React Strict Mode's dev
// double-mount, Fast Refresh, any HMR churn — which desyncs the loadable's
// internal chunk-id tracking from what the compiled bundle expects
// (ChunkLoadError that survives a full dev-server restart).
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function OpsMap({ pins, strings: s }: { pins: OpsPin[]; strings: OpsMapStrings }) {
  const [selectedId, setSelectedId] = useState(null as string | null);
  const selected = pins.find(p => p.id === selectedId) ?? null;
  const markers: GeoMarkerData[] = pins.map(p => ({
    id: p.id, lat: p.lat, lng: p.lng, label: p.label, tone: p.tone, radiusM: p.radiusM,
  }));

  return (
    <div className="stack" style={{ gap: "var(--ax-space-150)" }}>
      <div style={{ blockSize: 380, borderRadius: "var(--ax-radius-200)", overflow: "hidden" }}>
        <Suspense fallback={
          <EmptyState glyph="…" title={s.loadingTitle} body={s.loadingBody} bare role="status" ariaBusy />
        }>
          <GeoMap center={KSA_CENTER} zoom={KSA_ZOOM} markers={markers}
            selectedId={selectedId} onMarkerClick={setSelectedId} height="100%" />
        </Suspense>
      </div>
      <div className="row" style={{ gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <span className="t-caption">
          <span className="badge badge-compliant">{s.legendExecuting}</span>{" "}
          <span className="badge badge-warning">{s.legendEnRoute}</span>{" "}
          <span className="badge">{s.legendFactory}</span>
        </span>
        {selected
          ? <a className="ax-link" href={selected.href}>{s.open} — {selected.label}</a>
          : <span className="t-caption">{s.selectHint}</span>}
      </div>
    </div>
  );
}
