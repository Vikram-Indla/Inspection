"use client";
// M08-003/M08-009/M08-010 — live visit monitoring with region/city filtering
// and real auto-refresh. The filter round-trips through the URL so the server
// refilters the map + SLA panels too; the interval refresh re-fetches ONLY the
// monitoring rows through a server action (RLS-guarded), no full page reload.
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchMonitoringRows, type MonitorRow } from "./actions";
import EmptyState from "@/components/EmptyState";

export type MonitoringStrings = {
  regionLabel: string;
  cityLabel: string;
  allRegions: string;
  allCities: string;
  thVisit: string;
  thFactory: string;
  thOperational: string;
  thGeofence: string;
  thInspector: string;
  emptyTitle: string;
  emptyDesc: string;
  refreshedAt: string;
  refreshing: string;
  autoNote: string;
};

// Poll cadence mirrors ENG-06 telemetry_interval_s (30s) — the freshest signal
// the field app emits; anything faster is wasted load, anything slower is stale ops.
const REFRESH_MS = 30_000;

const GEOFENCE_TONE: Record<string, string> = {
  inside: "ax-lozenge--success",
  override: "ax-lozenge--warning",
};

export function RegionCityFilter({ region, city, regions, cities, strings: s }: {
  region: string; city: string; regions: string[]; cities: string[]; strings: MonitoringStrings;
}) {
  const router = useRouter();
  const apply = (r: string, c: string) => {
    const p = new URLSearchParams();
    if (r) p.set("region", r);
    if (c) p.set("city", c);
    const q = p.toString();
    router.replace(q ? `/operations?${q}` : "/operations");
  };
  return (
    <div className="row" style={{ gap: "var(--ax-space-200)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="ax-field"><label className="ax-field__label" htmlFor="monitoring-region">{s.regionLabel}</label>
        {/* changing region resets city — the city list is region-scoped server-side */}
        <select className="ax-select" id="monitoring-region" style={{ maxInlineSize: 220 }} value={region}
          onChange={e => apply(e.target.value, "")} aria-label={s.regionLabel}>
          <option value="">{s.allRegions}</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="monitoring-city">{s.cityLabel}</label>
        <select className="ax-select" id="monitoring-city" style={{ maxInlineSize: 220 }} value={city}
          onChange={e => apply(region, e.target.value)} aria-label={s.cityLabel}>
          <option value="">{s.allCities}</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select></div>
    </div>
  );
}

export function MonitoringTable({ initialRows, initialAt, region, city, enumLabels, strings: s }: {
  initialRows: MonitorRow[];
  initialAt: string;
  region: string;
  city: string;
  /** Server-localized labels for operational states / geofence results (SB19). */
  enumLabels: Record<string, string>;
  strings: MonitoringStrings;
}) {
  const [rows, setRows] = useState(initialRows);
  const [at, setAt] = useState(initialAt);
  const [err, setErr] = useState(null as string | null);
  const [pending, startTransition] = useTransition();

  // Server navigation (filter change) re-seeds the table.
  useEffect(() => { setRows(initialRows); setAt(initialAt); setErr(null); }, [initialRows, initialAt]);

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(async () => {
        const res = await fetchMonitoringRows(region, city);
        if (res.error) { setErr(res.error); return; }
        setErr(null);
        setRows(res.rows ?? []);
        setAt(res.at ?? "");
      });
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [region, city]);

  const label = (v: string) => enumLabels[v] ?? v.replace(/_/g, " ");

  return (
    <div className="stack" style={{ gap: "var(--ax-space-150)" }}>
      {err && <div className="ax-banner ax-banner--critical" role="alert"><div>{err}</div></div>}
      {rows.length === 0 ? (
        <EmptyState glyph="🛰" title={s.emptyTitle} body={s.emptyDesc} bare />
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th scope="col">{s.thVisit}</th><th scope="col">{s.thFactory}</th><th scope="col">{s.thOperational}</th><th scope="col">{s.thGeofence}</th><th scope="col">{s.thInspector}</th></tr></thead>
          <tbody>{rows.map(v => (
            <tr key={v.id}>
              <td><a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></td>
              <td>{v.factory_id
                ? <a className="ax-link" href={`/factories/${v.factory_id}`}>{v.factory_name ?? "—"}</a>
                : (v.factory_name ?? "—")}</td>
              <td><span className={`ax-lozenge ax-lozenge--ops ${v.operational_state === "executing" ? "ax-lozenge--success" : ""}`}>{label(v.operational_state)}</span></td>
              <td>{v.geofence
                ? <span className={`ax-lozenge ${GEOFENCE_TONE[v.geofence] ?? "ax-lozenge--critical"}`}>{label(v.geofence)}</span>
                : <span className="t-caption">—</span>}</td>
              <td>{v.inspector ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <p className="t-caption">
        {pending ? s.refreshing : `${s.refreshedAt} `}
        {!pending && at && <span className="numeric">{at.slice(11, 19)}</span>}
        {" · "}{s.autoNote}
      </p>
    </div>
  );
}
