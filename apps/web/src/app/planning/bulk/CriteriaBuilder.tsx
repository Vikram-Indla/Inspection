"use client";
// M01-003/012/022 — bulk targeting criteria builder. Replaces the two fixed
// region/band dropdowns with an add-condition builder: each condition is
// field ∈ {region, risk_band, activity_class, city} · operator ∈ {is, is-not} ·
// value, combined by a single AND/OR toggle. This is a GET form — the three
// controls per row are named cf/co/cv, so submitting posts index-aligned arrays
// the server page parses and evaluates over the factory set (M01-004: all
// matching returned). No client-side filtering — the builder only collects the
// criteria; the server owns evaluation.
import { useState } from "react";

export type Condition = { field: string; op: string; value: string };

export type CriteriaBuilderStrings = {
  heading: string; combineLabel: string; combineAnd: string; combineOr: string;
  fieldLabel: string; opLabel: string; valueLabel: string; valuePlaceholder: string;
  fieldRegion: string; fieldRiskBand: string; fieldActivity: string; fieldCity: string;
  opIs: string; opIsNot: string;
  addCondition: string; remove: string; apply: string; clear: string;
  matching: string; // "{n}" placeholder
  hint: string;
};

const FIELDS = ["region", "risk_band", "activity_class", "city"] as const;

export default function CriteriaBuilder({ initial, initialCombine, fieldOptions, matchCount, strings }: {
  initial: Condition[];
  initialCombine: string;
  fieldOptions: Record<string, string[]>;
  matchCount: number;
  strings: CriteriaBuilderStrings;
}) {
  const [rows, setRows] = useState<Condition[]>(initial.length ? initial : [{ field: "region", op: "is", value: "" }]);
  const [combine, setCombine] = useState(initialCombine === "or" ? "or" : "and");
  const fieldLabel = (f: string) =>
    f === "region" ? strings.fieldRegion
      : f === "risk_band" ? strings.fieldRiskBand
        : f === "activity_class" ? strings.fieldActivity
          : strings.fieldCity;
  const set = (i: number, patch: Partial<Condition>) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () => setRows(rs => [...rs, { field: "region", op: "is", value: "" }]);
  const remove = (i: number) => setRows(rs => rs.filter((_, j) => j !== i));

  return (
    <form method="get" className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap", alignItems: "flex-end" }}>
        <h4 style={{ margin: 0 }}>{strings.heading}</h4>
        <div className="ax-field" style={{ maxInlineSize: 200 }}>
          <label className="ax-field__label">{strings.combineLabel}</label>
          <select className="ax-select" name="combine" value={combine} onChange={e => setCombine(e.target.value)}>
            <option value="and">{strings.combineAnd}</option>
            <option value="or">{strings.combineOr}</option>
          </select>
        </div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
          <div className="ax-field" style={{ maxInlineSize: 190 }}>
            <label className="ax-field__label">{strings.fieldLabel}</label>
            <select className="ax-select" name="cf" value={r.field} onChange={e => set(i, { field: e.target.value, value: "" })}>
              {FIELDS.map(f => <option key={f} value={f}>{fieldLabel(f)}</option>)}
            </select>
          </div>
          <div className="ax-field" style={{ maxInlineSize: 150 }}>
            <label className="ax-field__label">{strings.opLabel}</label>
            <select className="ax-select" name="co" value={r.op} onChange={e => set(i, { op: e.target.value })}>
              <option value="is">{strings.opIs}</option>
              <option value="is-not">{strings.opIsNot}</option>
            </select>
          </div>
          <div className="ax-field" style={{ maxInlineSize: 220 }}>
            <label className="ax-field__label">{strings.valueLabel}</label>
            <input className="ax-input" name="cv" list={`vals-${i}`} value={r.value}
              onChange={e => set(i, { value: e.target.value })} placeholder={strings.valuePlaceholder} />
            <datalist id={`vals-${i}`}>
              {(fieldOptions[r.field] ?? []).map(v => <option key={v} value={v} />)}
            </datalist>
          </div>
          <button type="button" className="ax-btn ax-btn--subtle" onClick={() => remove(i)} disabled={rows.length === 1}>{strings.remove}</button>
        </div>
      ))}
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="ax-btn ax-btn--secondary" onClick={add}>{strings.addCondition}</button>
        <button className="ax-btn ax-btn--prominent">{strings.apply}</button>
        <a className="ax-btn ax-btn--subtle" href="/planning/bulk">{strings.clear}</a>
        <span className="ax-caption ax-numeric">{strings.matching.replace("{n}", String(matchCount))}</span>
      </div>
      <p className="ax-caption">{strings.hint}</p>
    </form>
  );
}
