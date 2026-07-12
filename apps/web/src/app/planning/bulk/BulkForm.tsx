"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { publishBulkPlan, type BulkResult } from "./actions";

type F = { id: string; factory_code: string; name: string; cr_number: string; city: string; region: string | null; risk_band: string | null; risk_score: number | null; visits: { planning_status: string; visit_type: string }[] };
type P = { id: string; version_label: string; packages: { code: string } };
type I = { user_id: string; full_name: string };

// SB19 — strings built server-side with t() and passed as props.
export type BulkFormStrings = {
  colFactory: string; colCr: string; colCity: string; colRisk: string; colEligibility: string; colInspector: string;
  selectFactory: string; inspectorFor: string; autoAssign: string; sharedWarning: string;
  duplicate: string; eligible: string;
  visitType: string; typePeriodic: string; packageLabel: string; windowStart: string; windowEnd: string;
  notes: string; notesPlaceholder: string;
  conflictsTitle: string; conflictLine: string; skipDuplicates: string;
  summaryTitle: string; summarySelected: string; summaryByBand: string; summaryByRegion: string;
  summaryType: string; summaryMode: string; summaryModePhysical: string;
  summaryAssignment: string; summaryManualN: string; summaryAutoN: string; summaryEmpty: string;
  blockedTitle: string; publish: string; publishing: string;
  riskBands: Record<string, string>;
};

export default function BulkForm({ factories, packages, inspectors, strings }: { factories: F[]; packages: P[]; inspectors: I[]; strings: BulkFormStrings }) {
  const [state, formAction, pending] = useActionState<BulkResult, FormData>(publishBulkPlan, {});
  const [selected, setSelected] = useState<string[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({}); // factory_id -> inspector_id ("" = auto)
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [notes, setNotes] = useState("");
  // React 19 auto-resets a <form action={...}>'s native controls after every
  // action completion (success and blocked) — see planning/single/Wizard.tsx
  // for the full writeup. Same fix here: controlled state + a resetKey
  // remount once the action settles.
  const isFirstRender = useRef(true);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setResetKey(k => k + 1);
  }, [state]);

  const dupOf = (f: F) => f.visits.some(v => ["draft", "published", "returned"].includes(v.planning_status) && v.visit_type === "periodic");
  const dupRows = factories.filter(dupOf);
  const toggle = (id: string, on: boolean) => setSelected(s => (on ? [...s, id] : s.filter(x => x !== id)));

  // Deterministic pre-publish summary (M01-016/026 non-AI leg): pure counts, no inference.
  const sel = factories.filter(f => selected.includes(f.id));
  const count = (keyOf: (f: F) => string) => {
    const out: Record<string, number> = {};
    for (const f of sel) { const k = keyOf(f); out[k] = (out[k] ?? 0) + 1; }
    return out;
  };
  const byBand = count(f => f.risk_band ?? "—");
  const byRegion = count(f => f.region ?? "—");
  const manualN = sel.filter(f => (picks[f.id] ?? "") !== "").length;
  // Same-window pick counts: bulk visits share one window, so picking the same
  // inspector on several rows is surfaced as a double-booking warning (M01-029).
  const pickCount: Record<string, number> = {};
  for (const f of sel) { const p = picks[f.id] ?? ""; if (p) pickCount[p] = (pickCount[p] ?? 0) + 1; }

  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-tablewrap"><table className="ax-table">
        <thead><tr><th style={{ inlineSize: 36 }}></th><th>{strings.colFactory}</th><th>{strings.colCr}</th><th>{strings.colCity}</th><th className="ax-td-num">{strings.colRisk}</th><th>{strings.colEligibility}</th><th>{strings.colInspector}</th></tr></thead>
        <tbody>
          {factories.map(f => {
            const dup = dupOf(f);
            const isSel = selected.includes(f.id);
            const pick = picks[f.id] ?? "";
            const shared = pick && isSel ? (pickCount[pick] ?? 0) - 1 : 0;
            return (
              <tr key={f.id}>
                <td><input type="checkbox" name="factory_id" value={f.id} disabled={dup} checked={isSel} onChange={e => toggle(f.id, e.target.checked)} aria-label={strings.selectFactory.replace("{name}", f.name)} /></td>
                <td><strong>{f.name}</strong> <span className="ax-caption">{f.factory_code}</span></td>
                <td className="ax-numeric">{f.cr_number}</td><td>{f.city}</td>
                <td className="ax-td-num"><span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{(f.risk_band && strings.riskBands[f.risk_band]) ?? f.risk_band} · {f.risk_score}</span></td>
                <td>{dup ? <span className="ax-lozenge ax-lozenge--critical">{strings.duplicate}</span> : <span className="ax-lozenge ax-lozenge--success">{strings.eligible}</span>}</td>
                <td>
                  <select className="ax-select" name={`inspector_${f.id}`} value={pick} disabled={dup || !isSel}
                    onChange={e => setPicks(p => ({ ...p, [f.id]: e.target.value }))}
                    aria-label={strings.inspectorFor.replace("{name}", f.name)} style={{ minInlineSize: 160 }}>
                    <option value="">{strings.autoAssign}</option>
                    {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
                  </select>
                  {shared > 0 && <div><span className="ax-lozenge ax-lozenge--warning">{strings.sharedWarning.replace("{n}", String(shared))}</span></div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
      {dupRows.length > 0 && (
        <div className="ax-banner ax-banner--warning">
          <div>
            <strong>{strings.conflictsTitle}</strong>
            <ul>{dupRows.map(f => <li key={f.id}>{strings.conflictLine.replace("{name}", f.name)}</li>)}</ul>
            <label className="ax-choice" style={{ display: "flex" }}>
              <input key={resetKey} type="checkbox" name="skip_duplicates" value="1"
                checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)} />
              <span>{strings.skipDuplicates}</span>
            </label>
          </div>
        </div>
      )}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "var(--ax-space-200)" }}>
        <div className="ax-field"><label className="ax-field__label">{strings.visitType}</label>
          <select className="ax-select" name="visit_type"><option value="periodic">{strings.typePeriodic}</option></select></div>
        <div className="ax-field"><label className="ax-field__label">{strings.packageLabel}</label>
          <select className="ax-select" name="package_version_id">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
        <div className="ax-field"><label className="ax-field__label">{strings.windowStart}</label>
          <input key={resetKey} className="ax-input ax-numeric" name="window_start" type="datetime-local" required
            value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
        <div className="ax-field"><label className="ax-field__label">{strings.windowEnd}</label>
          <input key={resetKey} className="ax-input ax-numeric" name="window_end" type="datetime-local" required
            value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
      </div>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <div className="ax-field"><label className="ax-field__label">{strings.notes}</label>
          <textarea key={resetKey} className="ax-textarea" name="notes" rows={2} placeholder={strings.notesPlaceholder}
            value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.summaryTitle}</h4>
        {sel.length === 0 ? <p className="ax-caption">{strings.summaryEmpty}</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "var(--ax-space-200)" }}>
            <div><span className="ax-caption">{strings.summarySelected}</span><div className="ax-numeric"><strong>{sel.length}</strong></div></div>
            <div><span className="ax-caption">{strings.summaryByBand}</span>
              <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
                {Object.entries(byBand).map(([b, n]) => <span key={b} className={`ax-lozenge ${b === "high" ? "ax-lozenge--critical" : b === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>{strings.riskBands[b] ?? b} · {n}</span>)}
              </div></div>
            <div><span className="ax-caption">{strings.summaryByRegion}</span>
              <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-100)" }}>
                {Object.entries(byRegion).map(([r, n]) => <span key={r} className="ax-lozenge ax-lozenge--info">{r} · {n}</span>)}
              </div></div>
            <div><span className="ax-caption">{strings.summaryType}</span><div>{strings.typePeriodic}</div></div>
            <div><span className="ax-caption">{strings.summaryMode}</span><div>{strings.summaryModePhysical}</div></div>
            <div><span className="ax-caption">{strings.summaryAssignment}</span>
              <div className="ax-numeric">{strings.summaryManualN.replace("{n}", String(manualN))} · {strings.summaryAutoN.replace("{n}", String(sel.length - manualN))}</div></div>
          </div>
        )}
      </div>
      {state.error && <div className="ax-validation" role="alert"><strong>{strings.blockedTitle}</strong><ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.publishing : strings.publish}</button>
      </div>
    </form>
  );
}
