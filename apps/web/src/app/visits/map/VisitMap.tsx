"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { GeoMarkerData } from "@/components/GeoMap";

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
  state: "State", assignedInspector: "Assigned inspector", inspectorFallback: "Inspector",
  unavailableScope: "Unavailable under current scope", latestLocation: "latest location",
};

export default function VisitMap({ visits, strings: s = DEFAULT_STRINGS }: { visits: MappedVisit[]; strings?: VisitMapStrings }) {
  const regions = useMemo(() => [...new Set(visits.map(v => v.region).filter(Boolean))].sort(), [visits]);
  const [region, setRegion] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => visits.filter(v => !region || v.region === region), [visits, region]);
  const markers: GeoMarkerData[] = filtered.flatMap(v => [
    { id: `factory:${v.id}`, lat: v.factoryLat, lng: v.factoryLng, tone: "neutral" as const,
      label: `${v.factoryName} · ${v.city} · ${v.operationalState.replace(/_/g, " ")}` },
    ...(v.inspectorLat != null && v.inspectorLng != null ? [{
      id: `inspector:${v.id}`, lat: v.inspectorLat, lng: v.inspectorLng, tone: "medium" as const,
      label: `${v.inspectorName || s.assignedInspector} · ${v.inspectorAt ? new Date(v.inspectorAt).toISOString().slice(0, 16).replace("T", " ") : s.latestLocation}`,
    }] : []),
  ]);
  const selectedVisitId = selectedId?.split(":")[1] ?? null;
  const selected = filtered.find(v => v.id === selectedVisitId);
  const center: [number, number] = selected
    ? [selected.factoryLat, selected.factoryLng]
    : markers.length ? [markers[0].lat, markers[0].lng] : [24.7136, 46.6753];

  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-200)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <label className="ax-field" style={{ minInlineSize: 260 }}><span className="ax-field__label">{s.region}</span>
          <select className="ax-select" value={region} onChange={e => { setRegion(e.target.value); setSelectedId(null); }}>
            <option value="">{s.allRegions}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div className="ax-row" style={{ gap: 8 }}>
          <span className="ax-lozenge ax-lozenge--info">{"● "}{s.factoryVisitLegend}</span>
          <span className="ax-lozenge ax-lozenge--warning">{"● "}{s.inspectorLegend}</span>
        </div>
      </div>
      <div className="ax-surface" style={{ blockSize: 520, overflow: "hidden", padding: 0 }} dir="ltr">
        {markers.length ? <GeoMap center={center} zoom={region || selected ? 9 : 5} markers={markers}
          selectedId={selectedId} onMarkerClick={setSelectedId} height="100%" /> : (
          <div className="ax-state"><span className="ax-state__glyph">∅</span><h4>{s.noneInRegion}</h4></div>
        )}
      </div>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th scope="col">{s.visit}</th><th scope="col">{s.factory}</th><th scope="col">{s.regionCity}</th><th scope="col">{s.inspectorLocation}</th><th scope="col">{s.state}</th></tr></thead>
        <tbody>{filtered.map(v => <tr key={v.id} className={v.id === selectedVisitId ? "is-selected" : undefined}>
          <td><a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></td>
          <td><a className="ax-link" href={`/factories/${v.factoryId}`}>{v.factoryName}</a></td>
          <td>{v.region} · {v.city}</td>
          <td>{v.inspectorLat == null ? s.unavailableScope : `${v.inspectorName || s.inspectorFallback} · ${v.inspectorAt ? new Date(v.inspectorAt).toISOString().slice(0, 16).replace("T", " ") : "—"}`}</td>
          <td><span className="ax-lozenge ax-lozenge--ops">{v.operationalState.replace(/_/g, " ")}</span></td>
        </tr>)}</tbody>
      </table></div>
    </div>
  );
}
