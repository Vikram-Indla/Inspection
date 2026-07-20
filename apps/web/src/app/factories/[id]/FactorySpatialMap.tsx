"use client";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type FactoryLocationEvent = {
  id: string; lat: number; lng: number; kind: string; occurredAt: string;
  overrideReason: string | null; visitId: string;
};

export type FactorySpatialMapStrings = {
  officialPin: string; observedArrival: string; gpsOverride: string; noLocations: string;
};

export default function FactorySpatialMap({ officialLat, officialLng, geofenceRadius, events, strings: s }: {
  officialLat: number; officialLng: number; geofenceRadius: number | null; events: FactoryLocationEvent[];
  strings: FactorySpatialMapStrings;
}) {
  const markers: GeoMarkerData[] = [
    { id: "official", lat: officialLat, lng: officialLng, label: "Industrial-license official location", tone: "neutral", radiusM: geofenceRadius ?? undefined },
    ...events.slice(0, 50).map(e => ({
      id: e.id, lat: e.lat, lng: e.lng,
      label: `${e.kind.replace(/_/g, " ")} · ${new Date(e.occurredAt).toISOString().slice(0, 16).replace("T", " ")}${e.overrideReason ? ` · ${e.overrideReason}` : ""}`,
      tone: (e.kind === "override" ? "high" : e.kind === "checkin" || e.kind === "arrival" ? "low" : "medium") as GeoMarkerData["tone"],
    })),
  ];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ blockSize: 280, borderRadius: "var(--ax-radius-standard)", overflow: "hidden", border: "1px solid var(--ax-color-border)" }} dir="ltr">
        <GeoMap center={[officialLat, officialLng]} zoom={14} markers={markers} height="100%" />
      </div>
      <div className="ax-row" style={{ gap: 8, flexWrap: "wrap" }}>
        <span className="ax-lozenge ax-lozenge--info">{s.officialPin}</span>
        <span className="ax-lozenge ax-lozenge--success">{s.observedArrival}</span>
        <span className="ax-lozenge ax-lozenge--critical">{s.gpsOverride}</span>
      </div>
      {events.length === 0 && <p className="ax-caption">{s.noLocations}</p>}
    </div>
  );
}
