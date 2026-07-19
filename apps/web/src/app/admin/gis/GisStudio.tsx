"use client";
// SCR-ADM-070 — GIS Studio map + geofence side panel (SB20 · ENG-06 · ENG-08).
// v1.1: search + zoom-to-result, region/risk filters, legend with live counts,
// linked map↔table selection, factories-without-coordinates surfaced.
// All user-facing copy arrives via the `strings` prop (SB19) so this client
// component stays i18n-agnostic — see page.tsx for the useT() build.
import { Suspense, useEffect, useMemo, useState, useActionState } from "react";
import dynamic from "next/dynamic";
import { updateGeofenceRadius, type GisResult } from "./actions";
import type { GeoFocus, GeoMarkerData, GeoTone } from "@/components/GeoMap";
import EmptyState from "@/components/EmptyState";

export type GisStrings = {
  loadingTitle: string; loadingBody: string;
  searchLabel: string; searchPlaceholder: string;
  filterRegionAll: string; filterBandAll: string;
  shownOf: string; noResults: string; noCoords: string;
  selectTitle: string; selectBody: string;
  coordsLabel: string; coordsCaption: string;
  radiusLabel: string; radiusHint: string;
  save: string; saving: string; saved: string;
  defaultsTitle: string; defaultsCheckin: string; defaultsArrival: string; defaultsFence: string;
  legendCaption: string;
  bandHigh: string; bandMedium: string; bandLow: string; bandUnbanded: string;
  thCode: string; thName: string; thRegion: string; thCity: string; thBand: string; thRadius: string; thCoords: string;
  radiusDefault: string;
};

export type GisFactory = {
  id: string; factory_code: string; name: string;
  city: string | null; region: string | null;
  official_lat: number | null; official_lng: number | null;
  risk_band: string | null; risk_score: number | null;
  geofence_radius_m: number | null;
};
export type GisSettings = {
  gps_accuracy_checkin_max_m?: number;
  arrival_detection_radius_m?: number;
  geofence_default_radius_m?: number;
};

function bandTone(band: string | null): GeoTone {
  return band === "high" ? "high" : band === "medium" ? "medium" : band === "low" ? "low" : "neutral";
}

// Module scope, not inside the component: next/dynamic must be called once
// at module load — calling it inside a component/hook (even memoized)
// re-registers the same chunk on every remount (Strict Mode dev double-mount,
// Fast Refresh) and desyncs the loadable's chunk-id tracking from the
// compiled bundle (ChunkLoadError that survives a full dev-server restart).
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function GisStudio({ factories, gis, strings: s }: {
  factories: GisFactory[]; gis: GisSettings; strings: GisStrings;
}) {
  const defaultFence = gis.geofence_default_radius_m ?? 150; // ENG-06 engine default
  const [selectedId, setSelectedId] = useState(null as string | null);
  const [draftRadius, setDraftRadius] = useState("");
  const [focus, setFocus] = useState(undefined as GeoFocus | undefined);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [band, setBand] = useState("");
  const [state, formAction, pending] = useActionState<GisResult, FormData>(updateGeofenceRadius, {});

  const bandLabel = (b: string | null) =>
    b === "high" ? s.bandHigh : b === "medium" ? s.bandMedium : b === "low" ? s.bandLow : s.bandUnbanded;

  const regions = useMemo(
    () => [...new Set(factories.map(f => f.region).filter((r): r is string => !!r))].sort(),
    [factories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return factories.filter(f =>
      (!region || f.region === region) &&
      (!band || (band === "unbanded" ? f.risk_band == null : f.risk_band === band)) &&
      (!q || [f.name, f.factory_code, f.city ?? "", f.region ?? ""].some(v => v.toLowerCase().includes(q))));
  }, [factories, query, region, band]);

  const located = useMemo(() => filtered.filter(f => f.official_lat != null && f.official_lng != null), [filtered]);
  const unlocated = filtered.length - located.length;
  const bandCounts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0, unbanded: 0 };
    for (const f of located) c[(f.risk_band === "high" || f.risk_band === "medium" || f.risk_band === "low") ? f.risk_band : "unbanded"]++;
    return c;
  }, [located]);

  const selected = factories.find(f => f.id === selectedId) ?? null;

  // A filter that hides the selected factory also clears the selection —
  // panel and map must never disagree about what is visible.
  useEffect(() => {
    if (selectedId && !located.some(f => f.id === selectedId)) setSelectedId(null);
  }, [selectedId, located]);

  function select(id: string) {
    const f = factories.find(x => x.id === id);
    if (!f || f.official_lat == null || f.official_lng == null) return;
    setSelectedId(id);
    setDraftRadius(String(f.geofence_radius_m ?? defaultFence));
    setFocus({ lat: f.official_lat, lng: f.official_lng, zoom: 12 });
  }

  // Enter in the search box = zoom to the first located match.
  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && located.length > 0) { e.preventDefault(); select(located[0].id); }
  }

  const markers: GeoMarkerData[] = useMemo(() => located.map(f => ({
    id: f.id,
    lat: f.official_lat as number,
    lng: f.official_lng as number,
    label: `${f.factory_code} — ${f.name} (${bandLabel(f.risk_band)})`,
    tone: bandTone(f.risk_band),
    // Live preview: while a factory is selected, its ring follows the draft radius.
    radiusM: f.id === selectedId && Number(draftRadius) > 0
      ? Number(draftRadius)
      : (f.geofence_radius_m ?? defaultFence),
  })), [located, selectedId, draftRadius, defaultFence]); // eslint-disable-line react-hooks/exhaustive-deps

  const lozengeFor = (b: string | null) =>
    `ax-lozenge ${b === "high" ? "ax-lozenge--critical" : b === "medium" ? "ax-lozenge--warning" : b === "low" ? "ax-lozenge--success" : "ax-lozenge--info"}`;

  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      {/* Toolbar — search + filters + result count (RTL mirrors via flex) */}
      <div className="ax-row" style={{ gap: "var(--ax-space-200)", alignItems: "center", flexWrap: "wrap" }}>
        <input
          className="ax-input" type="search" value={query}
          aria-label={s.searchLabel} placeholder={s.searchPlaceholder}
          onChange={e => setQuery(e.target.value)} onKeyDown={onSearchKey}
          style={{ flex: 1, minInlineSize: 240 }}
        />
        <select className="ax-select" style={{ maxInlineSize: 220 }} value={region} onChange={e => setRegion(e.target.value)} aria-label={s.thRegion}>
          <option value="">{s.filterRegionAll}</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="ax-select" style={{ maxInlineSize: 220 }} value={band} onChange={e => setBand(e.target.value)} aria-label={s.thBand}>
          <option value="">{s.filterBandAll}</option>
          <option value="high">{s.bandHigh}</option>
          <option value="medium">{s.bandMedium}</option>
          <option value="low">{s.bandLow}</option>
          <option value="unbanded">{s.bandUnbanded}</option>
        </select>
        <span className="ax-caption">
          <span className="ax-numeric">{filtered.length}</span> / <span className="ax-numeric">{factories.length}</span> {s.shownOf}
          {unlocated > 0 && <> · <span className="ax-numeric">{unlocated}</span> {s.noCoords}</>}
        </span>
      </div>

      <div style={{ display: "flex", gap: "var(--ax-space-300)", alignItems: "stretch", flexWrap: "wrap" }}>
        <div className="ax-panel" style={{ flex: 1, minInlineSize: 420, padding: 0, overflow: "hidden" }}>
          <Suspense fallback={
            <EmptyState glyph="…" title={s.loadingTitle} body={s.loadingBody} bare role="status" ariaBusy />
          }>
            <GeoMap
              center={[24.0, 44.5]} zoom={5}  // KSA-wide initial view
              markers={markers}
              height={560}
              selectedId={selectedId}
              focus={focus}
              onMarkerClick={select}
              onRadiusChange={(id, r) => { if (id === selectedId) setDraftRadius(String(r)); }}
            />
          </Suspense>
        </div>

        <aside className="ax-panel" style={{ inlineSize: "var(--ax-shell-panel-width)", padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          {!selected && (
            <EmptyState glyph="◎" title={s.selectTitle} body={s.selectBody} inline bare />
          )}

          {selected && (
            <>
              <div>
                <h4>{selected.name}</h4>
                <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap", marginBlockStart: "var(--ax-space-100)" }}>
                  <span className="ax-lozenge ax-lozenge--info">{selected.factory_code}</span>
                  <span className={lozengeFor(selected.risk_band)}>
                    {bandLabel(selected.risk_band)}{selected.risk_score != null ? ` · ${selected.risk_score}` : ""}
                  </span>
                </div>
                <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-100)" }}>
                  {selected.region ?? "—"} · {selected.city ?? "—"}
                </p>
              </div>

              <div>
                <div className="ax-field__label">{s.coordsLabel}</div>
                <p className="ax-numeric" dir="ltr">{selected.official_lat}, {selected.official_lng}</p>
                <p className="ax-caption">{s.coordsCaption}</p>
              </div>

              <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-150)" }}>
                <input type="hidden" name="factory_id" value={selected.id} />
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="gis-radius">{s.radiusLabel}</label>
                  <input
                    id="gis-radius" className="ax-input ax-numeric" name="geofence_radius_m"
                    type="number" min={1} step={1} required
                    value={draftRadius} onChange={e => setDraftRadius(e.target.value)}
                    placeholder={String(defaultFence)}
                  />
                  <p className="ax-field__hint">{s.radiusHint} (<span className="ax-numeric">{defaultFence}</span> m)</p>
                </div>
                <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center", flexWrap: "wrap" }}>
                  <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? s.saving : s.save}</button>
                  {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
                  {state.ok && <span className="ax-lozenge ax-lozenge--success">{s.saved}</span>}
                </div>
              </form>
            </>
          )}

          <div style={{ marginBlockStart: "auto" }}>
            <div className="ax-field__label">{s.defaultsTitle}</div>
            <table className="ax-table">
              <tbody>
                <tr><td>{s.defaultsCheckin}</td><td className="ax-numeric" dir="ltr">≤ {gis.gps_accuracy_checkin_max_m ?? "—"} m</td></tr>
                <tr><td>{s.defaultsArrival}</td><td className="ax-numeric" dir="ltr">{gis.arrival_detection_radius_m ?? "—"} m</td></tr>
                <tr><td>{s.defaultsFence}</td><td className="ax-numeric" dir="ltr">{defaultFence} m</td></tr>
              </tbody>
            </table>
            {/* Legend with live counts of the pins currently on the map */}
            <div className="ax-row" style={{ gap: "var(--ax-space-100)", marginBlockStart: "var(--ax-space-150)", flexWrap: "wrap", alignItems: "center" }}>
              <span className="ax-lozenge ax-lozenge--critical">{s.bandHigh} <span className="ax-numeric">{bandCounts.high}</span></span>
              <span className="ax-lozenge ax-lozenge--warning">{s.bandMedium} <span className="ax-numeric">{bandCounts.medium}</span></span>
              <span className="ax-lozenge ax-lozenge--success">{s.bandLow} <span className="ax-numeric">{bandCounts.low}</span></span>
              {bandCounts.unbanded > 0 && <span className="ax-lozenge ax-lozenge--info">{s.bandUnbanded} <span className="ax-numeric">{bandCounts.unbanded}</span></span>}
              <span className="ax-caption">{s.legendCaption}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Linked registry table — row click selects on the map; selection highlights the row */}
      <div className="ax-tablewrap">
        <table className="ax-table">
          <thead>
            <tr>
              <th>{s.thCode}</th><th>{s.thName}</th><th>{s.thRegion}</th><th>{s.thCity}</th>
              <th>{s.thBand}</th><th>{s.thRadius}</th><th>{s.thCoords}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7}><span className="ax-caption">{s.noResults}</span></td></tr>
            )}
            {filtered.map(f => {
              const hasCoords = f.official_lat != null && f.official_lng != null;
              const isSel = f.id === selectedId;
              return (
                <tr
                  key={f.id}
                  onClick={hasCoords ? () => select(f.id) : undefined}
                  aria-selected={isSel || undefined}
                  style={{
                    cursor: hasCoords ? "pointer" : "default",
                    background: isSel ? "var(--ax-color-selected-tint, var(--ax-color-neutral-tint))" : undefined,
                  }}
                >
                  <td className="ax-numeric">{f.factory_code}</td>
                  <td><strong>{f.name}</strong></td>
                  <td>{f.region ?? "—"}</td>
                  <td>{f.city ?? "—"}</td>
                  <td><span className={lozengeFor(f.risk_band)}>{bandLabel(f.risk_band)}</span></td>
                  <td className="ax-numeric" dir="ltr">
                    {f.geofence_radius_m ?? defaultFence} m{f.geofence_radius_m == null && <span className="ax-caption"> · {s.radiusDefault}</span>}
                  </td>
                  <td className="ax-numeric" dir="ltr">{hasCoords ? `${f.official_lat}, ${f.official_lng}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
