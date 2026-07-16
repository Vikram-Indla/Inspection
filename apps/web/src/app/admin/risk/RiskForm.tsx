"use client";
// SCR-ADM-060 · CD-014 — Risk model editor (R2 alignment).
// Factors + bands are live configuration in engine_settings. This client form
// adds what the R2 design requires WITHOUT changing the server action:
//  - live weights-sum arithmetic (the exact rule saveRiskSettings enforces),
//    with Save disabled until the sum is 1.00 and a live per-factor weight bar;
//  - the save RESULT surfaced (sum-fail / RLS-denied / saved) — previously the
//    action's return value was discarded by an `as () => void` cast.
// There is no draft/approval step: a successful save is effective immediately.
import { useMemo, useState, useActionState } from "react";
import { saveRiskSettings } from "./actions";

// Factor names are resolved to strings on the server — a function prop cannot
// cross the server→client boundary (Next throws at render).
type Factor = { key: string; weight: number; name: string };
type SaveState = { error?: string; ok?: boolean };

export type RiskLabels = {
  factorsTitle: string;
  bandsTitle: string;
  lowEnds: string;
  mediumEnds: string;
  high: string;
  sumOk: string;
  sumBad: string; // "{sum}" is substituted
  save: string;
  saving: string;
  saved: string;
  savedNote: string;
  lastUpdated: string;
  bandLow: string;
  bandMedium: string;
  bandHigh: string;
};

export default function RiskForm({
  factors: initialFactors,
  lowMax: initialLow,
  medMax: initialMed,
  updatedAt,
  labels,
}: {
  factors: Factor[];
  lowMax: number;
  medMax: number;
  updatedAt: string | null;
  labels: RiskLabels;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(initialFactors.map(f => [f.key, f.weight])),
  );
  const [lowMax, setLowMax] = useState(initialLow);
  const [medMax, setMedMax] = useState(initialMed);

  // useActionState wrapper keeps the server action's signature untouched.
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveRiskSettings(fd),
    {},
  );

  const sum = useMemo(
    () => Object.values(weights).reduce((s, w) => s + (Number.isFinite(w) ? w : 0), 0),
    [weights],
  );
  const sumOk = Math.abs(sum - 1) <= 0.001;
  const maxWeight = Math.max(0.0001, ...Object.values(weights).map(w => (Number.isFinite(w) ? w : 0)));

  return (
    <form action={formAction} className="ax-surface" style={{ padding: "var(--ax-space-400)", display: "flex", flexDirection: "column", gap: "var(--ax-space-300)", maxInlineSize: 720 }}>
      <h4>{labels.factorsTitle}</h4>
      {initialFactors.map(f => {
        const w = weights[f.key] ?? 0;
        const pct = Math.round((Number.isFinite(w) ? w : 0) / maxWeight * 100);
        return (
          <div key={f.key} className="rk-driver">
            <div className="rk-driver__name"><b>{f.name}</b></div>
            <input
              className="ax-input ax-numeric rk-w" id={f.key} name={f.key} type="number" step="0.05" min="0" max="1"
              value={Number.isFinite(w) ? w : ""}
              onChange={e => setWeights(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
              style={{ maxInlineSize: 110 }} aria-label={f.name}
            />
            <div className="rk-bar" aria-hidden="true"><span style={{ inlineSize: `${pct}%` }} /></div>
          </div>
        );
      })}

      <div className="rk-sum" role="status" aria-live="polite">
        {sumOk
          ? <span className="ax-lozenge ax-lozenge--success">{labels.sumOk}</span>
          : <span className="ax-lozenge ax-lozenge--critical">{labels.sumBad.replace("{sum}", sum.toFixed(2))}</span>}
      </div>

      <h4>{labels.bandsTitle}</h4>
      <div className="ax-row">
        <div className="ax-field"><label className="ax-field__label" htmlFor="low_max">{labels.lowEnds}</label>
          <input className="ax-input ax-numeric" id="low_max" name="low_max" type="number" value={lowMax}
            onChange={e => setLowMax(parseInt(e.target.value, 10))} /></div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="med_max">{labels.mediumEnds}</label>
          <input className="ax-input ax-numeric" id="med_max" name="med_max" type="number" value={medMax}
            onChange={e => setMedMax(parseInt(e.target.value, 10))} /></div>
        <div className="ax-field"><label className="ax-field__label">{labels.high}</label>
          <input className="ax-input" value={`${(Number.isFinite(medMax) ? medMax : 0) + 1}–100`} readOnly /></div>
      </div>
      <div className="rk-band">
        <span className="rk-bandchip"><span className="rk-bandchip__dot" style={{ background: "var(--ax-color-success)" }} />{labels.bandLow} 0–{lowMax}</span>
        <span className="rk-bandchip"><span className="rk-bandchip__dot" style={{ background: "var(--ax-color-warning)" }} />{labels.bandMedium} {lowMax + 1}–{medMax}</span>
        <span className="rk-bandchip"><span className="rk-bandchip__dot" style={{ background: "var(--ax-color-critical)" }} />{labels.bandHigh} {medMax + 1}–100</span>
      </div>

      <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
        <p className="ax-caption ax-numeric">{labels.lastUpdated} {updatedAt ? new Date(updatedAt).toISOString().slice(0, 16).replace("T", " ") : "—"}</p>
        <span className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
          {state.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
          <button className="ax-btn ax-btn--prominent" disabled={pending || !sumOk} aria-disabled={!sumOk}>
            {pending ? labels.saving : labels.save}
          </button>
        </span>
      </div>
      {state.error && <p className="ax-caption" role="alert" style={{ color: "var(--ax-color-critical-strong)" }}>{state.error}</p>}
      <p className="ax-caption">{labels.savedNote}</p>
    </form>
  );
}
