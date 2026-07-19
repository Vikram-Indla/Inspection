"use client";
import { useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";

export type FactoryRow = {
  id: string; factory_code: string; name: string; cr_number: string;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
};

// Server-built strings (strings-prop pattern — client components cannot call useT()).
export type FactoryListStrings = {
  regionLabel: string;
  allRegions: string;
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
  const regions = useMemo(
    () => Array.from(new Set(factories.map(f => f.region).filter((r): r is string => !!r))).sort(),
    [factories]);
  const rows = useMemo(() => {
    return region ? factories.filter(f => f.region === region) : factories;
  }, [factories, region]);
  return (
    <>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockEnd: "var(--ax-space-200)" }}>
        <div className="ax-field"><label className="ax-field__label" htmlFor="factory-region-filter">{strings.regionLabel}</label>
          <select id="factory-region-filter" className="ax-select" value={region} onChange={e => setRegion(e.target.value)} style={{ maxInlineSize: 220 }}>
            <option value="">{strings.allRegions}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select></div>
        <span className="ax-caption"><span className="ax-numeric">{rows.length}</span> {strings.of} <span className="ax-numeric">{factories.length}</span> {strings.factoriesWord}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState glyph="🏭" title={strings.emptyRegionTitle} body={strings.emptyRegionDesc} />
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>{strings.thFactory}</th><th>{strings.thCr}</th><th>{strings.thRegion}</th><th>{strings.thCity}</th><th className="ax-td-num">{strings.thRisk}</th><th></th></tr></thead>
          <tbody>{rows.map(f => (
            <tr key={f.id}>
              <td><strong>{f.name}</strong> <span className="ax-caption">{f.factory_code}</span></td>
              <td className="ax-numeric">{f.cr_number}</td>
              <td><span className="ax-lozenge ax-lozenge--info">{f.region ?? "—"}</span></td>
              <td>{f.city}</td>
              <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{(f.risk_band && strings.bandLabels[f.risk_band]) ?? f.risk_band} · {f.risk_score}</span></td>
              <td><a className="ax-link" href={`/factories/${f.id}`}>{strings.dossier} →</a></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
