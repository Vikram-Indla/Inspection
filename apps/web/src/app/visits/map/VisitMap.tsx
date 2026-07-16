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

export default function VisitMap({ visits }: { visits: MappedVisit[] }) {
  const regions = useMemo(() => [...new Set(visits.map(v => v.region).filter(Boolean))].sort(), [visits]);
  const [region, setRegion] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => visits.filter(v => !region || v.region === region), [visits, region]);
  const markers: GeoMarkerData[] = filtered.flatMap(v => [
    { id: `factory:${v.id}`, lat: v.factoryLat, lng: v.factoryLng, tone: "neutral" as const,
      label: `${v.factoryName} · ${v.city} · ${v.operationalState.replace(/_/g, " ")}` },
    ...(v.inspectorLat != null && v.inspectorLng != null ? [{
      id: `inspector:${v.id}`, lat: v.inspectorLat, lng: v.inspectorLng, tone: "medium" as const,
      label: `${v.inspectorName || "Assigned inspector"} · ${v.inspectorAt ? new Date(v.inspectorAt).toISOString().slice(0, 16).replace("T", " ") : "latest location"}`,
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
        <label className="ax-field" style={{ minInlineSize: 260 }}><span className="ax-field__label">Region</span>
          <select className="ax-select" value={region} onChange={e => { setRegion(e.target.value); setSelectedId(null); }}>
            <option value="">All regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <div className="ax-row" style={{ gap: 8 }}>
          <span className="ax-lozenge ax-lozenge--info">● factory / visit</span>
          <span className="ax-lozenge ax-lozenge--warning">● latest inspector position</span>
        </div>
      </div>
      <div className="ax-surface" style={{ blockSize: 520, overflow: "hidden", padding: 0 }} dir="ltr">
        {markers.length ? <GeoMap center={center} zoom={region || selected ? 9 : 5} markers={markers}
          selectedId={selectedId} onMarkerClick={setSelectedId} height="100%" /> : (
          <div className="ax-state"><span className="ax-state__glyph">∅</span><h4>No located visits in this region</h4></div>
        )}
      </div>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th>Visit</th><th>Factory</th><th>Region / city</th><th>Inspector location</th><th>State</th></tr></thead>
        <tbody>{filtered.map(v => <tr key={v.id} className={v.id === selectedVisitId ? "is-selected" : undefined}>
          <td><a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></td>
          <td><a className="ax-link" href={`/factories/${v.factoryId}`}>{v.factoryName}</a></td>
          <td>{v.region} · {v.city}</td>
          <td>{v.inspectorLat == null ? "Unavailable under current scope" : `${v.inspectorName || "Inspector"} · ${v.inspectorAt ? new Date(v.inspectorAt).toISOString().slice(0, 16).replace("T", " ") : "—"}`}</td>
          <td><span className="ax-lozenge ax-lozenge--ops">{v.operationalState.replace(/_/g, " ")}</span></td>
        </tr>)}</tbody>
      </table></div>
    </div>
  );
}
