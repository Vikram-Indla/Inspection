"use client";
// Full-screen inspector task map (SAQEEL Field — "View full map"). Interactive
// Mapbox GeoMap of the inspector's own RLS-scoped assigned visits that carry
// official coordinates. Real markers only — no fabricated pins. GeoMap renders
// its own governed "Map service unavailable"/empty state when Mapbox is not
// configured or no visit is geocoded. Mapbox is browser-only → dynamic ssr:false.
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";

const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <div className="sq-skeleton" style={{ blockSize: "100%", minBlockSize: 240 }} />,
});

export default function FieldFullMap({
  markers, center, ariaLabel,
}: { markers: GeoMarkerData[]; center: [number, number]; ariaLabel: string }) {
  return (
    // flex:1 gives a used height; the absolute inner div turns that into a
    // definite box so GeoMap's blockSize:100% resolves and Mapbox fills the
    // whole screen instead of collapsing to its 300px default.
    <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <GeoMap
          center={center}
          zoom={markers.length === 1 ? 13 : markers.length ? 7 : 6}
          markers={markers}
          fitMarkers
          height="100%"
          interactive
          ariaLabel={ariaLabel}
        />
      </div>
    </div>
  );
}
