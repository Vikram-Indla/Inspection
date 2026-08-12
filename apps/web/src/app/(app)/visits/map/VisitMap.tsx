"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { GeoMarkerData } from "@/components/GeoMap";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./visit-map.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type MappedVisit = {
  id: string; factoryId: string; factoryName: string; region: string; city: string;
  factoryLat: number; factoryLng: number; inspectorName: string;
  inspectorLat: number | null; inspectorLng: number | null; inspectorAt: string | null;
  operationalState: string;
  riskBand?: string | null; windowStart?: string | null; windowEnd?: string | null;
};

export type VisitMapStrings = {
  region: string; allRegions: string; factoryVisitLegend: string; inspectorLegend: string;
  legendLabel: string; noneInRegion: string; noneInRegionBody: string;
  assignedInspector: string; inspectorFallback: string; latestLocation: string; openVisit: string;
};

const DEFAULT_STRINGS: VisitMapStrings = {
  region: "Region", allRegions: "All regions", factoryVisitLegend: "Factory",
  inspectorLegend: "latest inspector position", legendLabel: "Map legend",
  noneInRegion: "No located visits in this region", noneInRegionBody: "",
  assignedInspector: "Assigned inspector", inspectorFallback: "Inspector",
  latestLocation: "latest location", openVisit: "Open visit",
};

const openHref = (v: MappedVisit) => `/visits/${v.id}`;

export default function VisitMap({ visits, strings: s = DEFAULT_STRINGS, locale = "en" }: {
  visits: MappedVisit[];
  strings?: VisitMapStrings;
  locale?: Locale;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const markers: GeoMarkerData[] = useMemo(() => visits.flatMap(visit => [
    {
      id: `factory:${visit.id}`, lat: visit.factoryLat, lng: visit.factoryLng, tone: "neutral" as const,
      label: `${visit.factoryName} · ${visit.city}`,
    },
    ...(visit.inspectorLat != null && visit.inspectorLng != null ? [{
      id: `inspector:${visit.id}`, lat: visit.inspectorLat, lng: visit.inspectorLng, tone: "medium" as const,
      label: `${visit.inspectorName || s.assignedInspector} · ${visit.inspectorAt ? formatDateTime(visit.inspectorAt, locale === "ar" ? "ar" : "en") : s.latestLocation}`,
    }] : []),
  ]), [visits, s, locale]);

  const selectedVisitId = selectedId?.split(":")[1] ?? null;
  const selected = visits.filter(visit => visit.id === selectedVisitId);
  const center: [number, number] = markers.length ? [markers[0].lat, markers[0].lng] : [24.7136, 46.6753];

  return (
    <div className={styles.root}>
      <div className={styles.legend}>
        <StatusPill tone="info" ping={false}>{s.factoryVisitLegend}</StatusPill>
        <StatusPill tone="warning" ping={false}>{s.inspectorLegend}</StatusPill>
      </div>

      <div className={styles.canvas} dir="ltr">
        {markers.length ? (
          <GeoMap
            center={center} zoom={5} markers={markers} fitMarkers
            selectedId={selectedId} onMarkerClick={setSelectedId} height="100%"
          />
        ) : (
          <EmptyState icon="map" title={s.noneInRegion} description={s.noneInRegionBody} size="sm" />
        )}
      </div>

      {selected.map(v => (
        <div className={styles.selected} key={v.id}>
          <Text as="span" role="bodyStrong" dir="auto">{v.factoryName}</Text>
          <Button variant="secondary" size="sm" href={openHref(v)}>{s.openVisit}</Button>
        </div>
      ))}
    </div>
  );
}
