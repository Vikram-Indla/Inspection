"use client";
// INSP-697 — Coverage Filters / Unassigned Visits / Regional Visit Coverage.
// Planning-only (basePath === "/planning"), matches Figma SCR-PLN-200 (node
// 433:49148). Renders alongside the existing interactive map rather than
// replacing it — the map's live inspector positions stay intact.
// Class names are copied verbatim from the sibling VisitMap.tsx in this same
// folder (stack/row/field/select/panel/badge/sq-link/sq-btn) — no new CSS.
import { useMemo, useState } from "react";
import type { MappedVisit } from "./VisitMap";
import { filterVisits, regionalCoverage } from "./coverage-filters";

export type CoveragePanelStrings = {
  title: string;
  filtersTitle: string;
  regionLabel: string; allRegions: string;
  riskLabel: string; allRisk: string; riskHigh: string; riskMedium: string; riskLow: string;
  windowLabel: string; window7: string; window30: string; window90: string; windowAll: string;
  inspectorLabel: string; inspectorAll: string; inspectorAssigned: string; inspectorUnassigned: string;
  resetLabel: string;
  unassignedCount: (n: number) => string; unassignedEmpty: string;
  regionalTitle: string; regionalHelp: string; visitsCount: (n: number) => string;
};

const riskLabelKey = (band: string) =>
  (`risk${band.charAt(0).toUpperCase()}${band.slice(1)}` as "riskHigh" | "riskMedium" | "riskLow");

export default function CoveragePanel({ visits, strings: s }: { visits: MappedVisit[]; strings: CoveragePanelStrings }) {
  const regions = useMemo(() => [...new Set(visits.map(v => v.region).filter(Boolean))].sort(), [visits]);
  const [region, setRegion] = useState("");
  const [risk, setRisk] = useState("");
  const [windowDays, setWindowDays] = useState<number | null>(30);
  const [inspectorFilter, setInspectorFilter] = useState<"" | "assigned" | "unassigned">("");

  const filtered = useMemo(
    () => filterVisits(visits, { region, risk, windowDays, inspectorFilter }, Date.now()),
    [visits, region, risk, windowDays, inspectorFilter],
  );

  const unassigned = useMemo(() => filtered.filter(v => !v.inspectorName), [filtered]);

  const regionalCounts = useMemo(() => regionalCoverage(filtered), [filtered]);

  const reset = () => { setRegion(""); setRisk(""); setWindowDays(30); setInspectorFilter(""); };

  return (
    <section className="stack" aria-label={s.title} style={{ gap: "var(--space-4)" }}>
      <div className="row" style={{ alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div className="panel stack" style={{ padding: "var(--space-4)", gap: "var(--space-3)", minInlineSize: 260, flex: "1 1 280px" }}>
          <h3>{s.filtersTitle}</h3>
          <label className="field"><span className="sq-field__label">{s.regionLabel}</span>
            <select className="select" value={region} onChange={e => setRegion(e.target.value)}>
              <option value="">{s.allRegions}</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="field"><span className="sq-field__label">{s.riskLabel}</span>
            <select className="select" value={risk} onChange={e => setRisk(e.target.value)}>
              <option value="">{s.allRisk}</option>
              <option value="high">{s.riskHigh}</option>
              <option value="medium">{s.riskMedium}</option>
              <option value="low">{s.riskLow}</option>
            </select>
          </label>
          <label className="field"><span className="sq-field__label">{s.windowLabel}</span>
            <select className="select" value={windowDays ?? ""} onChange={e => setWindowDays(e.target.value === "" ? null : Number(e.target.value))}>
              <option value="7">{s.window7}</option>
              <option value="30">{s.window30}</option>
              <option value="90">{s.window90}</option>
              <option value="">{s.windowAll}</option>
            </select>
          </label>
          <label className="field"><span className="sq-field__label">{s.inspectorLabel}</span>
            <select className="select" value={inspectorFilter} onChange={e => setInspectorFilter(e.target.value as "" | "assigned" | "unassigned")}>
              <option value="">{s.inspectorAll}</option>
              <option value="assigned">{s.inspectorAssigned}</option>
              <option value="unassigned">{s.inspectorUnassigned}</option>
            </select>
          </label>
          <button type="button" className="sq-btn sq-btn--secondary" onClick={reset}>{s.resetLabel}</button>

          <h3>{s.unassignedCount(unassigned.length)}</h3>
          {unassigned.length === 0
            ? <span className="field-help">{s.unassignedEmpty}</span>
            : <ul className="stack" style={{ gap: "var(--space-2)", listStyle: "none", margin: 0, padding: 0 }}>
                {unassigned.slice(0, 20).map(v => (
                  <li key={v.id} className="panel" style={{ padding: "var(--space-3)" }}>
                    <a className="sq-link" href={`/factories/${v.factoryId}`}>{v.factoryName}</a>
                    <div className="field-help">
                      {v.riskBand ? (s[riskLabelKey(v.riskBand)] ?? v.riskBand) : "—"}
                      {v.region ? ` · ${v.region}` : ""}
                    </div>
                  </li>
                ))}
              </ul>}
        </div>

        <div className="panel stack" style={{ padding: "var(--space-4)", gap: "var(--space-2)", flex: "1 1 280px" }}>
          <h3>{s.regionalTitle}</h3>
          <span className="field-help">{s.regionalHelp}</span>
          {regionalCounts.length === 0
            ? <span className="field-help">{s.unassignedEmpty}</span>
            : <ul className="stack" style={{ gap: "var(--space-2)", listStyle: "none", margin: 0, padding: 0 }}>
                {regionalCounts.map(([r, count]) => (
                  <li key={r} className="row" style={{ justifyContent: "space-between" }}>
                    <span>{r}</span>
                    <span className="badge badge-info">{s.visitsCount(count)}</span>
                  </li>
                ))}
              </ul>}
        </div>
      </div>
    </section>
  );
}
