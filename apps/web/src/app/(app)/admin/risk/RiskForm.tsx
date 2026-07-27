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
import { validateBands, validateWeights, type RiskBands } from "@/lib/risk/model";
import { AdminRecordArticle } from "../_components/AdminRecordDrawer";

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
  invalidBands: string;
  confirmLive: string;
  factorKey: string;
  weight: string;
  modelVersion: string;
  notConfigured: string;
  drawerSubtitle: string;
};

export default function RiskForm({
  factors: initialFactors,
  lowMax: initialLow,
  medMax: initialMed,
  updatedAt,
  modelVersion,
  drawerGovernance,
  labels,
}: {
  factors: Factor[];
  lowMax: number;
  medMax: number;
  updatedAt: string | null;
  modelVersion: string;
  drawerGovernance: readonly string[];
  labels: RiskLabels;
}) {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(initialFactors.map(f => [f.key, f.weight])),
  );
  const [lowMax, setLowMax] = useState(initialLow);
  const [medMax, setMedMax] = useState(initialMed);
  const [confirmedLive, setConfirmedLive] = useState(false);

  // useActionState wrapper keeps the server action's signature untouched.
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveRiskSettings(fd),
    {},
  );

  const sum = useMemo(
    () => Object.values(weights).reduce((s, w) => s + (Number.isFinite(w) ? w : 0), 0),
    [weights],
  );
  const weightValidation = validateWeights(
    initialFactors.map(f => ({ key: f.key, weight: weights[f.key] })),
  );
  const bands: RiskBands = {
    low: [0, lowMax],
    medium: [lowMax + 1, medMax],
    high: [medMax + 1, 100],
  };
  const bandValidation = validateBands(bands);
  const sumOk = weightValidation.ok;
  const maxWeight = Math.max(0.0001, ...Object.values(weights).map(w => (Number.isFinite(w) ? w : 0)));

  return (
    <form action={formAction} className="panel" style={{ padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-6)", maxInlineSize: 720 }}>
      <h4>{labels.factorsTitle}</h4>
      {initialFactors.map(f => {
        const w = weights[f.key] ?? 0;
        const pct = Math.round((Number.isFinite(w) ? w : 0) / maxWeight * 100);
        const factorId = `risk-factor-${f.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
        return (
          <AdminRecordArticle
            key={f.key}
            id={factorId}
            className="rk-driver"
            record={{
              title: f.name,
              subtitle: labels.drawerSubtitle,
              record: [
                { label: labels.factorKey, value: f.key },
                {
                  label: labels.weight,
                  value: Number.isFinite(w) ? `${(w * 100).toFixed(2).replace(/\.?0+$/, "")}%` : labels.notConfigured,
                },
                { label: labels.modelVersion, value: modelVersion },
              ],
              governance: drawerGovernance,
              audit: updatedAt
                ? [{ label: labels.lastUpdated, value: new Date(updatedAt).toLocaleString() }]
                : [],
              editHref: `#${factorId}`,
              auditHref: `/admin/audit?q=${encodeURIComponent(f.key)}`,
            }}
          >
            <div className="rk-driver__name"><b>{f.name}</b></div>
            <input
              className="sq-input numeric rk-w" id={f.key} name={f.key} type="number" step="0.05" min="0" max="1"
              value={Number.isFinite(w) ? w : ""}
              onChange={e => setWeights(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) }))}
              style={{ maxInlineSize: 110 }} aria-label={f.name}
            />
            <div className="rk-bar" aria-hidden="true"><span style={{ inlineSize: `${pct}%` }} /></div>
          </AdminRecordArticle>
        );
      })}

      <div className="rk-sum" role="status" aria-live="polite">
        {sumOk
          ? <span className="badge badge-compliant">{labels.sumOk}</span>
          : <span className="badge badge-critical">{labels.sumBad.replace("{sum}", sum.toFixed(2))}</span>}
      </div>

      <h4>{labels.bandsTitle}</h4>
      <div className="row">
        <div className="sq-field"><label className="sq-field__label" htmlFor="low_max">{labels.lowEnds}</label>
          <input className="sq-input numeric" id="low_max" name="low_max" type="number" value={lowMax}
            onChange={e => setLowMax(parseInt(e.target.value, 10))} /></div>
        <div className="sq-field"><label className="sq-field__label" htmlFor="med_max">{labels.mediumEnds}</label>
          <input className="sq-input numeric" id="med_max" name="med_max" type="number" value={medMax}
            onChange={e => setMedMax(parseInt(e.target.value, 10))} /></div>
        <div className="sq-field"><label className="sq-field__label" htmlFor="risk-high-band">{labels.high}</label>
          <input className="sq-input" id="risk-high-band" value={`${(Number.isFinite(medMax) ? medMax : 0) + 1}–100`} readOnly /></div>
      </div>
      <div className="rk-band">
        <span className="rk-bandchip"><span className="rk-bandchip__dot" style={{ background: "var(--status-compliant)" }} />{labels.bandLow} 0–{lowMax}</span>
        <span className="rk-bandchip"><span className="rk-bandchip__dot" style={{ background: "var(--status-warning)" }} />{labels.bandMedium} {lowMax + 1}–{medMax}</span>
        <span className="rk-bandchip"><span className="rk-bandchip__dot" style={{ background: "var(--status-critical)" }} />{labels.bandHigh} {medMax + 1}–100</span>
      </div>
      {!bandValidation.ok && <p className="t-caption rk-validation" role="alert">{labels.invalidBands}</p>}

      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <p className="t-caption numeric">{labels.lastUpdated} {updatedAt ? new Date(updatedAt).toISOString().slice(0, 16).replace("T", " ") : "—"}</p>
        <span className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
          {state.ok && !pending && <span className="badge badge-compliant">{labels.saved}</span>}
          <button className="btn btn-primary btn-lg btn-touch" disabled={pending || !sumOk || !bandValidation.ok || !confirmedLive} aria-disabled={!sumOk || !bandValidation.ok || !confirmedLive}>
            {pending ? labels.saving : labels.save}
          </button>
        </span>
      </div>
      <label className="rk-live-confirm">
        <input type="checkbox" checked={confirmedLive} onChange={e => setConfirmedLive(e.target.checked)} />
        <span>{labels.confirmLive}</span>
      </label>
      {state.error && <p className="t-caption" role="alert" style={{ color: "var(--status-critical-text)" }}>{state.error}</p>}
      <p className="t-caption">{labels.savedNote}</p>
    </form>
  );
}
