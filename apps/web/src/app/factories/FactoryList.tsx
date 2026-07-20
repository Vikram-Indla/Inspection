"use client";
import { useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";

export type FactoryRow = {
  id: string; factory_code: string; name: string; cr_number: string;
  dossier_href?: string;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  // FNS-103/104 — real registration flag. is_temporary = unregistered/unlicensed
  // establishment created for an immediate visit (0001_foundation L135, M01-045);
  // a licensed/registered factory synced from the national source is is_temporary=false.
  is_temporary: boolean;
};

type LicenseKey = "" | "licensed" | "unlicensed";

// Server-built strings (strings-prop pattern — client components cannot call useT()).
export type FactoryListStrings = {
  regionLabel: string;
  allRegions: string;
  // FNS-107 — city filter alongside region.
  cityLabel: string;         // register: HT-025 "City" (المدينة)
  allCities: string;         // generic connective (mirrors allRegions) — draft
  // FNS-103/104 — licensed/unlicensed segmentation.
  licenseGroupAria: string;  // group a11y label — no register row (draft)
  licenseAll: string;        // generic "All" — draft
  licensed: string;          // register: EM-103 "Licensed"/مرخصة (term); segment-label draft pending review
  unlicensed: string;        // register: EM-002 "Unlicensed Establishments"/غير مرخصة
  of: string;
  factoriesWord: string;
  emptyRegionTitle: string;
  emptyRegionDesc: string;
  thFactory: string;
  thCr: string;
  thRegion: string;
  thCity: string;
  thRisk: string;
  dossier: string;
  bandLabels: Record<string, string>;
};

// SCR-WEB-400 / M07-001 — factory registry list with client-side region filter.
export default function FactoryList({ factories, strings }: { factories: FactoryRow[]; strings: FactoryListStrings }) {
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");                       // FNS-107
  const [license, setLicense] = useState<LicenseKey>("");     // FNS-103/104
  const regions = useMemo(
    () => Array.from(new Set(factories.map(f => f.region).filter((r): r is string => !!r))).sort(),
    [factories]);
  const cities = useMemo(
    () => Array.from(new Set(factories.map(f => f.city).filter((c): c is string => !!c))).sort(),
    [factories]);
  const rows = useMemo(() =>
    factories.filter(f =>
      (!region || f.region === region) &&
      (!city || f.city === city) &&
      (license === "" || (license === "unlicensed" ? f.is_temporary : !f.is_temporary))),
    [factories, region, city, license]);
  return (
    <>
      <div className="row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockEnd: "var(--ax-space-200)" }}>
        {/* FNS-103/104 — licensed/unlicensed segmentation over the real is_temporary flag */}
        <div className="ax-segmented" role="group" aria-label={strings.licenseGroupAria}>
          {([["", strings.licenseAll], ["licensed", strings.licensed], ["unlicensed", strings.unlicensed]] as [LicenseKey, string][]).map(([k, label]) => (
            <button key={k || "all"} type="button" aria-pressed={license === k} onClick={() => setLicense(k)}>{label}</button>
          ))}
        </div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="factory-region-filter">{strings.regionLabel}</label>
          <select id="factory-region-filter" className="ax-select" value={region} onChange={e => setRegion(e.target.value)} style={{ maxInlineSize: 220 }}>
            <option value="">{strings.allRegions}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select></div>
        {/* FNS-107 — city filter (city data already loaded) */}
        <div className="ax-field"><label className="ax-field__label" htmlFor="factory-city-filter">{strings.cityLabel}</label>
          <select id="factory-city-filter" className="ax-select" value={city} onChange={e => setCity(e.target.value)} style={{ maxInlineSize: 220 }}>
            <option value="">{strings.allCities}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <span className="t-caption"><span className="numeric">{rows.length}</span> {strings.of} <span className="numeric">{factories.length}</span> {strings.factoriesWord}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState glyph="🏭" title={strings.emptyRegionTitle} body={strings.emptyRegionDesc} />
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th scope="col">{strings.thFactory}</th><th scope="col">{strings.thCr}</th><th scope="col">{strings.thRegion}</th><th scope="col">{strings.thCity}</th><th scope="col" className="ax-td-num">{strings.thRisk}</th><th scope="col"></th></tr></thead>
          <tbody>{rows.map(f => (
            <tr key={f.id}>
              <td><strong>{f.name}</strong> <span className="t-caption">{f.factory_code}</span></td>
              <td className="numeric">{f.cr_number}</td>
              <td><span className="ax-lozenge ax-lozenge--info">{f.region ?? "—"}</span></td>
              <td>{f.city}</td>
              <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{(f.risk_band && strings.bandLabels[f.risk_band]) ?? f.risk_band} · {f.risk_score}</span></td>
              <td><a className="ax-link" href={f.dossier_href ?? `/factories/${f.id}`}>{strings.dossier} →</a></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
