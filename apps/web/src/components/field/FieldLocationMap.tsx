"use client";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";

// Single-site location map for the field screens (My Tasks visit-location card,
// etc.). Renders the REAL shared Mapbox GeoMap with one marker at the
// establishment's official coordinates — no fabricated pins. GeoMap itself
// degrades to a governed "Map service unavailable" state when the Mapbox token
// isn't configured, so this never shows a fake map. Loaded client-only (Mapbox
// GL needs the browser) and absolutely filled so it sits inside a sized,
// position:relative container.
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function FieldLocationMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const markers: GeoMarkerData[] = [{ id: "site", lat, lng, label, tone: "neutral" }];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <GeoMap center={[lng, lat]} zoom={14} markers={markers} interactive={false} showRegions={false} ariaLabel={label} />
    </div>
  );
}
