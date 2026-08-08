"use client";
import dynamic from "next/dynamic";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { GeoMarkerData } from "@/components/GeoMap";
import { titleCase } from "@/features/factories/portfolio";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./FactorySpatialMap.module.css";

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
    { id: "official", lat: officialLat, lng: officialLng, label: s.officialPin, tone: "neutral", radiusM: geofenceRadius ?? undefined },
    ...events.slice(0, 50).map(e => ({
      id: e.id, lat: e.lat, lng: e.lng,
      label: `${titleCase(e.kind)} · ${formatDateTime(e.occurredAt, locale === "ar" ? "ar" : "en")}${e.overrideReason ? ` · ${e.overrideReason}` : ""}`,
      tone: (e.kind === "override" ? "high" : e.kind === "checkin" || e.kind === "arrival" ? "low" : "medium") as GeoMarkerData["tone"],
    })),
  ];
  return (
    <div className={styles.root}>
      <div className={styles.frame} dir="ltr">
        <GeoMap center={[officialLat, officialLng]} zoom={14} markers={markers} height="100%" />
      </div>
      <div className={styles.legend}>
        <StatusPill tone="info">{s.officialPin}</StatusPill>
        <StatusPill tone="success">{s.observedArrival}</StatusPill>
        <StatusPill tone="danger">{s.gpsOverride}</StatusPill>
      </div>
      {events.length === 0 ? <p className={styles.empty}>{s.noLocations}</p> : null}
    </div>
  );
}
