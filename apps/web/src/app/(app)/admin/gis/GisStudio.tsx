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
    `sq-lozenge ${b === "high" ? "sq-lozenge--critical" : b === "medium" ? "sq-lozenge--warning" : b === "low" ? "sq-lozenge--success" : "sq-lozenge--info"}`;

  return (
    <div className="sq-stack sq-stack--roomy">
      {/* Toolbar — search + filters + result count (RTL mirrors via flex) */}
      <div className="sq-row sq-row--roomy">
        <input
          className="sq-input" type="search" value={query}
          aria-label={s.searchLabel} placeholder={s.searchPlaceholder}
          onChange={e => setQuery(e.target.value)} onKeyDown={onSearchKey}
          style={{ flex: 1, minInlineSize: 240 }}
        />
        <select className="sq-select" style={{ maxInlineSize: 220 }} value={region} onChange={e => setRegion(e.target.value)} aria-label={s.thRegion}>
          <option value="">{s.filterRegionAll}</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="sq-select" style={{ maxInlineSize: 220 }} value={band} onChange={e => setBand(e.target.value)} aria-label={s.thBand}>
          <option value="">{s.filterBandAll}</option>
          <option value="high">{s.bandHigh}</option>
          <option value="medium">{s.bandMedium}</option>
          <option value="low">{s.bandLow}</option>
          <option value="unbanded">{s.bandUnbanded}</option>
        </select>
        <span className="t-caption">
          <span className="numeric">{filtered.length}</span> / <span className="numeric">{factories.length}</span> {s.shownOf}
          {unlocated > 0 && <> · <span className="numeric">{unlocated}</span> {s.noCoords}</>}
        </span>
      </div>

      <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "stretch", flexWrap: "wrap" }}>
        <div className="sq-panel" style={{ flex: 1, minInlineSize: 420, padding: 0, overflow: "hidden" }}>
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

        <aside className="sq-panel" style={{ inlineSize: "var(--panel-w)", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {!selected && (
            <EmptyState glyph="◎" title={s.selectTitle} body={s.selectBody} inline bare />
          )}

          {selected && (
            <>
              <div>
                <h4>{selected.name}</h4>
                <div className="row" style={{ gap: "var(--space-2)", flexWrap: "wrap", marginBlockStart: "var(--space-2)" }}>
                  <span className="badge badge-info">{selected.factory_code}</span>
                  <span className={lozengeFor(selected.risk_band)}>
                    {bandLabel(selected.risk_band)}{selected.risk_score != null ? ` · ${selected.risk_score}` : ""}
                  </span>
                </div>
                <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>
                  {selected.region ?? "—"} · {selected.city ?? "—"}
                </p>
              </div>

              <div>
                <div className="sq-field__label">{s.coordsLabel}</div>
                <p className="numeric" dir="ltr">{selected.official_lat}, {selected.official_lng}</p>
                <p className="t-caption">{s.coordsCaption}</p>
              </div>

              <form action={formAction} className="stack">
                <input type="hidden" name="factory_id" value={selected.id} />
                <div className="sq-field">
                  <label className="sq-field__label" htmlFor="gis-radius">{s.radiusLabel}</label>
                  <input
                    id="gis-radius" className="sq-input numeric" name="geofence_radius_m"
                    type="number" min={1} step={1} required
                    value={draftRadius} onChange={e => setDraftRadius(e.target.value)}
                    placeholder={String(defaultFence)}
                  />
                  <p className="sq-field__hint">{s.radiusHint} (<span className="numeric">{defaultFence}</span> m)</p>
                </div>
                <div className="sq-row">
                  <button className="btn btn-primary btn-lg btn-touch" disabled={pending}>{pending ? s.saving : s.save}</button>
                  {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
                  {state.ok && <span className="badge badge-compliant">{s.saved}</span>}
                </div>
              </form>
            </>
          )}

          <div style={{ marginBlockStart: "auto" }}>
            <div className="sq-field__label">{s.defaultsTitle}</div>
            <table className="sq-table">
              <tbody>
                <tr><td>{s.defaultsCheckin}</td><td className="numeric" dir="ltr">≤ {gis.gps_accuracy_checkin_max_m ?? "—"} m</td></tr>
                <tr><td>{s.defaultsArrival}</td><td className="numeric" dir="ltr">{gis.arrival_detection_radius_m ?? "—"} m</td></tr>
                <tr><td>{s.defaultsFence}</td><td className="numeric" dir="ltr">{defaultFence} m</td></tr>
              </tbody>
            </table>
            {/* Legend with live counts of the pins currently on the map */}
            <div className="row" style={{ gap: "var(--space-2)", marginBlockStart: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
              <span className="badge badge-critical">{s.bandHigh} <span className="numeric">{bandCounts.high}</span></span>
              <span className="badge badge-warning">{s.bandMedium} <span className="numeric">{bandCounts.medium}</span></span>
              <span className="badge badge-compliant">{s.bandLow} <span className="numeric">{bandCounts.low}</span></span>
              {bandCounts.unbanded > 0 && <span className="badge badge-info">{s.bandUnbanded} <span className="numeric">{bandCounts.unbanded}</span></span>}
              <span className="t-caption">{s.legendCaption}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Linked registry table — row click selects on the map; selection highlights the row */}
      <div className="sq-tablewrap">
        <table className="sq-table">
          <thead>
            <tr>
              <th scope="col">{s.thCode}</th><th scope="col">{s.thName}</th><th scope="col">{s.thRegion}</th><th scope="col">{s.thCity}</th>
              <th scope="col">{s.thBand}</th><th scope="col">{s.thRadius}</th><th scope="col">{s.thCoords}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7}><span className="t-caption">{s.noResults}</span></td></tr>
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
                    background: isSel ? "var(--accent-soft, var(--surface-secondary))" : undefined,
                  }}
                >
                  <td className="numeric">{f.factory_code}</td>
                  <td><strong>{f.name}</strong></td>
                  <td>{f.region ?? "—"}</td>
                  <td>{f.city ?? "—"}</td>
                  <td><span className={lozengeFor(f.risk_band)}>{bandLabel(f.risk_band)}</span></td>
                  <td className="numeric" dir="ltr">
                    {f.geofence_radius_m ?? defaultFence} m{f.geofence_radius_m == null && <span className="t-caption"> · {s.radiusDefault}</span>}
                  </td>
                  <td className="numeric" dir="ltr">{hasCoords ? `${f.official_lat}, ${f.official_lng}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
