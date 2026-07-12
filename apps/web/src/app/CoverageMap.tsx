"use client";
// SCR-PUB-000 — public coverage teaser map. Same GeoMap primitive as
// Operations (OpsMap.tsx) and admin/gis, loaded client-only via next/dynamic.
// Static demo markers only — no live/authenticated data on the public landing.
import { useMemo, useState, type ComponentProps, type ComponentType } from "react";
import dynamic from "next/dynamic";
import type { default as GeoMapComponent, GeoMarkerData, GeoTone } from "@/components/GeoMap";

export type CoverageRegion = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  tone: GeoTone;
  facilities: number;
  inspectors: number;
};

export type CoverageMapStrings = {
  loadingTitle: string;
  loadingBody: string;
  facilities: string;
  inspectors: string;
  legendHigh: string;
  legendMedium: string;
  legendLow: string;
};

const KSA_CENTER: [number, number] = [23.8859, 45.0792];
// Country-level framing, not a world view — zoom 5 showed everything from
// France to India with the 7 KSA markers clustered into a few pixels.
const KSA_ZOOM = 6;

export default function CoverageMap({ regions, strings: s }: { regions: CoverageRegion[]; strings: CoverageMapStrings }) {
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
  const markers: GeoMarkerData[] = regions.map(r => ({ id: r.id, lat: r.lat, lng: r.lng, label: r.name, tone: r.tone }));

  return (
    <div className="mk-coverage">
      <div className="mk-coverage__map">
        <CoverageMapInner GeoMap={GeoMap} markers={markers} selectedId={selectedId} onMarkerClick={setSelectedId} />
      </div>
      <div className="mk-coverage__rail">
        <div className="mk-coverage__legend">
          <span className="ax-lozenge ax-lozenge--critical">{s.legendHigh}</span>
          <span className="ax-lozenge ax-lozenge--warning">{s.legendMedium}</span>
          <span className="ax-lozenge ax-lozenge--success">{s.legendLow}</span>
        </div>
        <ul className="mk-coverage__list">
          {regions.map(r => (
            <li key={r.id} className={r.id === selectedId ? "mk-coverage__row mk-coverage__row--active" : "mk-coverage__row"}
              onMouseEnter={() => setSelectedId(r.id)}>
              <span className={`mk-coverage__dot mk-coverage__dot--${r.tone}`} aria-hidden="true" />
              <strong>{r.name}</strong>
              <span className="mk-coverage__figure">{r.facilities} {s.facilities}</span>
              <span className="mk-coverage__figure">{r.inspectors} {s.inspectors}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CoverageMapInner({ GeoMap, markers, selectedId, onMarkerClick }: {
  GeoMap: ComponentType<ComponentProps<typeof GeoMapComponent>>;
  markers: GeoMarkerData[];
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
}) {
  return (
    <GeoMap center={KSA_CENTER} zoom={KSA_ZOOM} markers={markers}
      selectedId={selectedId} onMarkerClick={onMarkerClick} height="100%" interactive={false} />
  );
}
