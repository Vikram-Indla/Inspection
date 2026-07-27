"use client";
// SAQEEL Field Dashboard (Home) — "Nearby tasks map" preview.
// Rebuilt to the canonical SAQEEL Field Dashboard.dc.html: the Home is the
// simple briefing/quick-actions/map/register surface, NOT the previous
// KPI/charts-heavy build. The rest of the Home is server-rendered in
// field/page.tsx; this client island is only the Mapbox preview, which must
// run client-side (GeoMap canon: browser-only, dynamic ssr:false).
//
// Real data only: markers come from the inspector's own RLS-scoped assigned
// visits that carry official coordinates (factories.official_lat/lng, owned by
// GIS Admin). Factories without official coordinates contribute no pin — the
// design's decorative fake pins are never fabricated here. When Mapbox is not
// configured or no visit is geocoded, GeoMap renders its own governed
// "Map service unavailable" / empty state.
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";

// Mapbox is browser-only — dynamic import with ssr:false (GeoMap canon).
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <div className="sq-skeleton" style={{ blockSize: "100%", minBlockSize: 200 }} />,
});

export type FieldHomeMarker = GeoMarkerData;

export default function FieldHome({
  markers,
  center,
  ariaLabel,
}: {
  markers: GeoMarkerData[];
  center: [number, number];
  ariaLabel: string;
}) {
  return (
    <GeoMap
      center={center}
      zoom={markers.length === 1 ? 12 : 6}
      markers={markers}
      height="100%"
      interactive={false}
      ariaLabel={ariaLabel}
    />
  );
}
