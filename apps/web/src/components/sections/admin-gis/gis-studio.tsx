"use client";

import { useActionState, useMemo, useState } from "react";
import { updateGeofenceRadius, type GisResult } from "@/app/(app)/admin/gis/actions";
import type { GeoFocus, GeoMarkerData, GeoTone } from "@/components/GeoMap";
import { bandLabel, type AdminGisMessages } from "@/features/admin-gis/strings";
import type { GisFactory, GisSettings } from "@/features/admin-gis/types";
import GisMapPanel, { type BandCounts } from "./gis-map-panel";
import GisRegistry from "./gis-registry";
import GisToolbar from "./gis-toolbar";
import styles from "./gis.module.css";

function bandGeoTone(band: string | null): GeoTone {
  if (band === "high") return "high";
  if (band === "medium") return "medium";
  if (band === "low") return "low";
  return "neutral";
}

export default function GisStudio({ strings, factories, settings, canEdit }: {
  strings: AdminGisMessages;
  factories: readonly GisFactory[];
  settings: GisSettings;
  canEdit: boolean;
}) {
  const defaultFence = settings.geofence_default_radius_m ?? 150;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftRadius, setDraftRadius] = useState("");
  const [focus, setFocus] = useState<GeoFocus | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [band, setBand] = useState("");
  const [state, formAction, pending] = useActionState<GisResult, FormData>(updateGeofenceRadius, {});

  const regions = useMemo(
    () => [...new Set(factories.map(factory => factory.region).filter((value): value is string => !!value))].sort(),
    [factories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return factories.filter(factory =>
      (!region || factory.region === region) &&
      (!band || (band === "unbanded" ? factory.risk_band == null : factory.risk_band === band)) &&
      (!q || [factory.name, factory.factory_code, factory.city ?? "", factory.region ?? ""].some(value => value.toLowerCase().includes(q))));
  }, [factories, query, region, band]);

  const located = useMemo(() => filtered.filter(factory => factory.official_lat != null && factory.official_lng != null), [filtered]);
  const unlocated = filtered.length - located.length;

  const bandCounts = useMemo<BandCounts>(() => {
    const counts: BandCounts = { high: 0, medium: 0, low: 0, unbanded: 0 };
    for (const factory of located) {
      counts[factory.risk_band === "high" || factory.risk_band === "medium" || factory.risk_band === "low" ? factory.risk_band : "unbanded"]++;
    }
    return counts;
  }, [located]);

  const selected = located.find(factory => factory.id === selectedId) ?? null;

  const markers = useMemo<GeoMarkerData[]>(() => located.map(factory => ({
    id: factory.id,
    lat: factory.official_lat as number,
    lng: factory.official_lng as number,
    label: `${factory.factory_code} — ${factory.name} (${bandLabel(factory.risk_band, strings)})`,
    tone: bandGeoTone(factory.risk_band),
    radiusM: factory.id === selectedId && Number(draftRadius) > 0 ? Number(draftRadius) : (factory.geofence_radius_m ?? defaultFence),
  })), [located, selectedId, draftRadius, defaultFence, strings]);

  function select(id: string) {
    const factory = factories.find(candidate => candidate.id === id);
    if (!factory || factory.official_lat == null || factory.official_lng == null) return;
    setSelectedId(id);
    setDraftRadius(String(factory.geofence_radius_m ?? defaultFence));
    setFocus({ lat: factory.official_lat, lng: factory.official_lng, zoom: 12 });
  }

  return (
    <div className={styles.studio}>
      <GisToolbar
        strings={strings}
        query={query}
        region={region}
        band={band}
        regions={regions}
        shown={filtered.length}
        total={factories.length}
        unlocated={unlocated}
        onQuery={setQuery}
        onRegion={setRegion}
        onBand={setBand}
      />
      <GisMapPanel
        strings={strings}
        markers={markers}
        selectedId={selectedId}
        focus={focus}
        selected={selected}
        settings={settings}
        defaultFence={defaultFence}
        draftRadius={draftRadius}
        canEdit={canEdit}
        bandCounts={bandCounts}
        state={state}
        formAction={formAction}
        pending={pending}
        onMarkerClick={select}
        onRadiusChange={(id, radiusM) => { if (id === selectedId) setDraftRadius(String(radiusM)); }}
        onDraftChange={setDraftRadius}
      />
      <GisRegistry strings={strings} factories={filtered} selectedId={selectedId} defaultFence={defaultFence} onSelect={select} />
    </div>
  );
}
