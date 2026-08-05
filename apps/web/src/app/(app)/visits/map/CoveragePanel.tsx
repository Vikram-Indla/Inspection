"use client";
// INSP-697 — Coverage Filters / Unassigned Visits / Regional Visit Coverage.
// Planning-only (basePath === "/planning"), matches Figma SCR-PLN-200 (node
// 433:49148). Renders alongside the existing interactive map rather than
// replacing it — the map's live inspector positions stay intact.
//
// Markup/class contract: copied verbatim from two real, already-approved
// sources — the sibling VisitMap.tsx in this folder (stack/row/field/select/
// panel/badge/sq-link) and planning/bulk/DistributionPanels.tsx (panel/
// panel-header/panel-title/panel-body/row/grow/numeric/t-caption/sq-grid-2
// for the two-panel layout). No inline style props, no new CSS.
import { useMemo, useState } from "react";

// Counts arrive as templates carrying {n}, not as formatter functions.
// Functions cannot cross the server/client boundary: passing them threw
// "Functions cannot be passed directly to Client Components" and took the
// whole /planning/map route down with a server-side exception.
const fill = (template: string, n: number) => template.replace("{n}", String(n));
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
  unassignedCount: string; unassignedEmpty: string;
  regionalTitle: string; regionalHelp: string; visitsCount: string;
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
  const maxRegional = Math.max(1, ...regionalCounts.map(([, count]) => count));

  const reset = () => { setRegion(""); setRisk(""); setWindowDays(30); setInspectorFilter(""); };

  return (
    <section className="sq-grid-2" aria-label={s.title}>
      <div className="stack">
        <section className="panel" aria-label={s.filtersTitle}>
          <header className="panel-header">
            <h3 className="panel-title">{s.filtersTitle}</h3>
          </header>
          <div className="panel-body stack">
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
          </div>
        </section>

        <section className="panel" aria-label={fill(s.unassignedCount, unassigned.length)}>
          <header className="panel-header">
            <h3 className="panel-title">{fill(s.unassignedCount, unassigned.length)}</h3>
          </header>
          {unassigned.length === 0
            ? <p className="panel-body field-help">{s.unassignedEmpty}</p>
            : <ul className="panel-body stack">
                {unassigned.slice(0, 20).map(v => (
                  <li key={v.id} className="row">
                    <span className="grow">
                      <a className="sq-link" href={`/factories/${v.factoryId}`}>{v.factoryName}</a>
                      <span className="field-help">
                        {v.riskBand ? (s[riskLabelKey(v.riskBand)] ?? v.riskBand) : "—"}
                        {v.region ? ` · ${v.region}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>}
        </section>
      </div>

      <section className="panel" aria-label={s.regionalTitle}>
        <header className="panel-header">
          <h3 className="panel-title">{s.regionalTitle}</h3>
          <span className="t-caption">{s.regionalHelp}</span>
        </header>
        {regionalCounts.length === 0
          ? <p className="panel-body field-help">{s.unassignedEmpty}</p>
          : <ul className="panel-body stack">
              {regionalCounts.map(([r, count]) => (
                <li key={r} className="row">
                  <span className="grow"><bdi>{r}</bdi></span>
                  <progress max={maxRegional} value={count} aria-label={`${r}: ${fill(s.visitsCount, count)}`} />
                  <span className="numeric t-caption">{fill(s.visitsCount, count)}</span>
                </li>
              ))}
            </ul>}
      </section>
    </section>
  );
}
