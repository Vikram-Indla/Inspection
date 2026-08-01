"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { GeoMarkerData } from "@/components/GeoMap";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type MappedVisit = {
  id: string; factoryId: string; factoryName: string; region: string; city: string;
  factoryLat: number; factoryLng: number; inspectorName: string;
  inspectorLat: number | null; inspectorLng: number | null; inspectorAt: string | null;
  operationalState: string;
};

export type VisitMapStrings = {
  region: string; allRegions: string; factoryVisitLegend: string; inspectorLegend: string;
  noneInRegion: string; visit: string; factory: string; regionCity: string;
  inspectorLocation: string; state: string;
  assignedInspector?: string; inspectorFallback?: string; unavailableScope?: string; latestLocation?: string;
};

const DEFAULT_STRINGS: VisitMapStrings = {
  region: "Region", allRegions: "All regions", factoryVisitLegend: "factory / visit",
  inspectorLegend: "latest inspector position", noneInRegion: "No located visits in this region",
  visit: "Visit", factory: "Factory", regionCity: "Region / city", inspectorLocation: "Inspector location",
  state: "Visit status", assignedInspector: "Assigned inspector", inspectorFallback: "Inspector",
  unavailableScope: "Not available for your access", latestLocation: "latest location",
};

export default function VisitMap({ visits, strings: s = DEFAULT_STRINGS, locale = "en" }: { visits: MappedVisit[]; strings?: VisitMapStrings; locale?: Locale }) {
  const regions = useMemo(() => [...new Set(visits.map(v => v.region).filter(Boolean))].sort(), [visits]);
  const [region, setRegion] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => visits.filter(v => !region || v.region === region), [visits, region]);
  const markers: GeoMarkerData[] = filtered.flatMap(v => [
    { id: `factory:${v.id}`, lat: v.factoryLat, lng: v.factoryLng, tone: "neutral" as const,
      label: `${v.factoryName} · ${v.city} · ${v.operationalState.replace(/_/g, " ")}` },
    ...(v.inspectorLat != null && v.inspectorLng != null ? [{
      id: `inspector:${v.id}`, lat: v.inspectorLat, lng: v.inspectorLng, tone: "medium" as const,
      label: `${v.inspectorName || s.assignedInspector} · ${v.inspectorAt ? formatDateTime(v.inspectorAt, locale === "ar" ? "ar" : "en") : s.latestLocation}`,
    }] : []),
  ]);
  const selectedVisitId = selectedId?.split(":")[1] ?? null;
  const selected = filtered.find(v => v.id === selectedVisitId);
  const center: [number, number] = selected
    ? [selected.factoryLat, selected.factoryLng]
    : markers.length ? [markers[0].lat, markers[0].lng] : [24.7136, 46.6753];

  return (
    <div className="stack" style={{ gap: "var(--space-4)" }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <label className="field" style={{ minInlineSize: 260 }}><span className="sq-field__label">{s.region}</span>
          <select className="select" value={region} onChange={e => { setRegion(e.target.value); setSelectedId(null); }}>
            <option value="">{s.allRegions}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div className="row" style={{ gap: 8 }}>
          <span className="badge badge-info">{"● "}{s.factoryVisitLegend}</span>
          <span className="badge badge-warning">{"● "}{s.inspectorLegend}</span>
        </div>
      </div>
      <div className="panel" style={{ blockSize: 520, overflow: "hidden", padding: 0 }} dir="ltr">
        {markers.length ? <GeoMap center={center} zoom={region || selected ? 9 : 5} markers={markers}
          selectedId={selectedId} onMarkerClick={setSelectedId} height="100%" /> : (
          <EmptyState glyph="∅" title={s.noneInRegion} bare />
        )}
      </div>
      <div className="sq-tablewrap"><table className="sq-table">
        <thead><tr><th scope="col">{s.visit}</th><th scope="col">{s.factory}</th><th scope="col">{s.regionCity}</th><th scope="col">{s.inspectorLocation}</th><th scope="col">{s.state}</th></tr></thead>
        <tbody>{filtered.map(v => <tr key={v.id} className={v.id === selectedVisitId ? "is-selected" : undefined}>
          <td><a className="sq-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></td>
          <td><a className="sq-link" href={`/factories/${v.factoryId}`}>{v.factoryName}</a></td>
          <td>{v.region} · {v.city}</td>
          <td>{v.inspectorLat == null ? s.unavailableScope : `${v.inspectorName || s.inspectorFallback} · ${v.inspectorAt ? formatDateTime(v.inspectorAt, locale === "ar" ? "ar" : "en") : "—"}`}</td>
          <td><span className="sq-lozenge sq-lozenge--ops">{v.operationalState.replace(/_/g, " ")}</span></td>
        </tr>)}</tbody>
      </table></div>
    </div>
  );
}
