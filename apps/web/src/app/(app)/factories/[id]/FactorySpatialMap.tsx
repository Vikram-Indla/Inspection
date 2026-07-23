"use client";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type FactoryLocationEvent = {
  id: string; lat: number; lng: number; kind: string; occurredAt: string;
  overrideReason: string | null; visitId: string;
};

export type FactorySpatialMapStrings = {
  officialPin: string; observedArrival: string; gpsOverride: string; noLocations: string;
};

export default function FactorySpatialMap({ officialLat, officialLng, geofenceRadius, events, strings: s, locale }: {
  officialLat: number; officialLng: number; geofenceRadius: number | null; events: FactoryLocationEvent[];
  strings: FactorySpatialMapStrings; locale: Locale;
}) {
  const markers: GeoMarkerData[] = [
    { id: "official", lat: officialLat, lng: officialLng, label: "Industrial-license official location", tone: "neutral", radiusM: geofenceRadius ?? undefined },
    ...events.slice(0, 50).map(e => ({
      id: e.id, lat: e.lat, lng: e.lng,
      label: `${e.kind.replace(/_/g, " ")} · ${formatDateTime(e.occurredAt, locale === "ar" ? "ar" : "en")}${e.overrideReason ? ` · ${e.overrideReason}` : ""}`,
      tone: (e.kind === "override" ? "high" : e.kind === "checkin" || e.kind === "arrival" ? "low" : "medium") as GeoMarkerData["tone"],
    })),
  ];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ blockSize: 280, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-subtle)" }} dir="ltr">
        <GeoMap center={[officialLat, officialLng]} zoom={14} markers={markers} height="100%" />
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <span className="badge badge-info">{s.officialPin}</span>
        <span className="badge badge-compliant">{s.observedArrival}</span>
        <span className="badge badge-critical">{s.gpsOverride}</span>
      </div>
      {events.length === 0 && <p className="t-caption">{s.noLocations}</p>}
    </div>
  );
}
