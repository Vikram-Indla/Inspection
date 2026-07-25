"use client";
// M08-003/M08-009/M08-010 — visit monitoring with region/city filtering.
// The filter round-trips through the URL so the server re-filters the map and
// SLA panels from one request-time snapshot. No refresh cadence is claimed
// until the product contract configures one.
import { useRouter } from "next/navigation";
import { type MonitorRow } from "./actions";
import EmptyState from "@/components/EmptyState";
import { IconSatellite } from "@/app/icons";

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

const GEOFENCE_TONE: Record<string, string> = {
  inside: "sq-lozenge--success",
  override: "sq-lozenge--warning",
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
    <div className="row" style={{ gap: "var(--space-4)", alignItems: "flex-end", flexWrap: "wrap" }}>
      <div className="sq-field"><label className="sq-field__label" htmlFor="monitoring-region">{s.regionLabel}</label>
        {/* changing region resets city — the city list is region-scoped server-side */}
        <select className="sq-select" id="monitoring-region" style={{ maxInlineSize: 220 }} value={region}
          onChange={e => apply(e.target.value, "")} aria-label={s.regionLabel}>
          <option value="">{s.allRegions}</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select></div>
      <div className="sq-field"><label className="sq-field__label" htmlFor="monitoring-city">{s.cityLabel}</label>
        <select className="sq-select" id="monitoring-city" style={{ maxInlineSize: 220 }} value={city}
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
  const rows = initialRows;
  const at = initialAt;

  const label = (v: string) => enumLabels[v] ?? v.replace(/_/g, " ");

  return (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      {rows.length === 0 ? (
        <EmptyState icon={<IconSatellite size={28} />} title={s.emptyTitle} body={s.emptyDesc} bare />
      ) : (
        <div className="sq-tablewrap"><table className="sq-table">
          <thead><tr><th scope="col">{s.thVisit}</th><th scope="col">{s.thFactory}</th><th scope="col">{s.thOperational}</th><th scope="col">{s.thGeofence}</th><th scope="col">{s.thInspector}</th></tr></thead>
          <tbody>{rows.map(v => (
            <tr key={v.id}>
              <td><a className="sq-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></td>
              <td>{v.factory_id
                ? <a className="sq-link" href={`/factories/${v.factory_id}`}>{v.factory_name ?? "—"}</a>
                : (v.factory_name ?? "—")}</td>
              <td><span className={`sq-lozenge sq-lozenge--ops ${v.operational_state === "executing" ? "sq-lozenge--success" : ""}`}>{label(v.operational_state)}</span></td>
              <td>{v.geofence
                ? <span className={`sq-lozenge ${GEOFENCE_TONE[v.geofence] ?? "sq-lozenge--critical"}`}>{label(v.geofence)}</span>
                : <span className="t-caption">—</span>}</td>
              <td>{v.inspector ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <p className="t-caption">
        {s.refreshedAt} {at && <span className="numeric">{at.slice(11, 19)}</span>}
        {" · "}{s.autoNote}
      </p>
    </div>
  );
}
