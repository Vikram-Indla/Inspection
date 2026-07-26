"use client";
import { useActionState, useId, useMemo, useState } from "react";
import { createRiskDraft, transitionRiskModel, type RiskResult } from "./actions";
import {
  isRiskModelTransitionAllowed,
  RISK_MODEL_STATUSES,
  validateRiskModelPayload,
  type RiskModelPayload,
  type RiskModelStatus,
} from "@/lib/risk/model";

export type RiskModelRow = {
  id: string;
  version_label: string;
  status: RiskModelStatus;
  row_version: number;
  payload: RiskModelPayload;
  created_at: string;
  updated_at: string;
};
export type RiskStrings = {
  newLabel: string; payload: string; create: string; creating: string; created: string;
  transition: string; apply: string; applying: string; done: string; reasonPh: string;
  factorKey: string; factorWeight: string; addFactor: string; removeFactor: string;
  lowEnds: string; mediumEnds: string; validationReady: string; validationNeeded: string;
  inspect: string; immutable: string; noTransitions: string;
};

export function RiskModelsBoard({ rows, strings: s }: { rows: RiskModelRow[]; strings: RiskStrings }) {
  const [cState, cAction, creating] = useActionState<RiskResult, FormData>(createRiskDraft, {});
  const [factors, setFactors] = useState([{ key: "", weight: Number.NaN }]);
  const [lowMax, setLowMax] = useState<number>(Number.NaN);
  const [medMax, setMedMax] = useState<number>(Number.NaN);
  const payload = useMemo<RiskModelPayload>(() => ({
    factors,
    bands: {
      low: [0, lowMax],
      medium: [lowMax + 1, medMax],
      high: [medMax + 1, 100],
    },
  }), [factors, lowMax, medMax]);
  const validation = validateRiskModelPayload(payload);

  return (
    <div className="rk-model-layout">
      <form action={cAction} className="panel rk-composer">
        <div className="sq-field"><label className="sq-field__label" htmlFor="risk-model-version-label">{s.newLabel}</label>
          <input className="sq-input numeric" name="version_label" id="risk-model-version-label" required /></div>
        <fieldset className="rk-fieldset">
          <legend>{s.payload}</legend>
          {factors.map((factor, index) => (
            <div className="rk-factor-row" key={index}>
              <div className="sq-field">
                <label className="sq-field__label" htmlFor={`risk-factor-${index}`}>{s.factorKey}</label>
                <input
                  className="sq-input numeric"
                  id={`risk-factor-${index}`}
                  value={factor.key}
                  onChange={e => setFactors(current => current.map((item, i) => i === index ? { ...item, key: e.target.value } : item))}
                  required
                />
              </div>
              <div className="sq-field">
                <label className="sq-field__label" htmlFor={`risk-weight-${index}`}>{s.factorWeight}</label>
                <input
                  className="sq-input numeric"
                  id={`risk-weight-${index}`}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={Number.isFinite(factor.weight) ? factor.weight : ""}
                  onChange={e => setFactors(current => current.map((item, i) => i === index ? { ...item, weight: e.target.valueAsNumber } : item))}
                  required
                />
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={factors.length === 1}
                onClick={() => setFactors(current => current.filter((_, i) => i !== index))}
              >
                {s.removeFactor}
              </button>
            </div>
          ))}
          <button className="btn btn-secondary" type="button" onClick={() => setFactors(current => [...current, { key: "", weight: Number.NaN }])}>
            {s.addFactor}
          </button>
          <div className="rk-band-inputs">
            <div className="sq-field"><label className="sq-field__label" htmlFor="risk-draft-low">{s.lowEnds}</label>
              <input className="sq-input numeric" id="risk-draft-low" type="number" min="0" max="98" value={Number.isFinite(lowMax) ? lowMax : ""} onChange={e => setLowMax(e.target.valueAsNumber)} required /></div>
            <div className="sq-field"><label className="sq-field__label" htmlFor="risk-draft-medium">{s.mediumEnds}</label>
              <input className="sq-input numeric" id="risk-draft-medium" type="number" min="1" max="99" value={Number.isFinite(medMax) ? medMax : ""} onChange={e => setMedMax(e.target.valueAsNumber)} required /></div>
          </div>
        </fieldset>
        <input type="hidden" name="payload" value={JSON.stringify(payload)} />
        <p className={`rk-validation${validation.ok ? " is-valid" : ""}`} role="status" aria-live="polite">
          {validation.ok ? s.validationReady : `${s.validationNeeded}: ${validation.why}`}
        </p>
        <div className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
          <button className="btn btn-primary btn-touch" disabled={creating || !validation.ok}>{creating ? s.creating : s.create}</button>
          {cState.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{cState.error}</span>}
          {cState.ok && <span className="badge badge-compliant">{s.created}</span>}
        </div>
      </form>
      <section className="rk-model-list" aria-label={s.inspect}>
        {rows.map((m) => <RiskRow key={m.id} m={m} strings={s} />)}
      </section>
    </div>
  );
}

function RiskRow({ m, strings: s }: { m: RiskModelRow; strings: RiskStrings }) {
  const [tState, tAction, applying] = useActionState<RiskResult, FormData>(transitionRiskModel, {});
  const fieldId = useId();
  const targets = RISK_MODEL_STATUSES.filter((x) => isRiskModelTransitionAllowed(m.status, x));
  return (
    <article className="panel rk-model-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{m.version_label} <span className="sq-version">v{m.row_version}</span></h3>
        <span className="badge badge-info">{m.status}</span>
      </div>
      <details className="rk-model-detail">
        <summary>{s.inspect}</summary>
        <dl>
          {m.payload?.factors?.map(factor => (
            <div key={factor.key}><dt><code>{factor.key}</code></dt><dd className="numeric">{factor.weight}</dd></div>
          ))}
        </dl>
        {m.payload?.bands && (
          <div className="rk-band">
            {Object.entries(m.payload.bands).map(([key, range]) => <span className="rk-bandchip numeric" key={key}>{key}: {range[0]}–{range[1]}</span>)}
          </div>
        )}
      </details>
      {m.status === "published" && <p className="t-caption">{s.immutable}</p>}
      {targets.length > 0 && (
        <form action={tAction} className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="model_id" value={m.id} />
          <input type="hidden" name="from_status" value={m.status} />
          <input type="hidden" name="row_version" value={m.row_version} />
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-to-status`}>{s.transition}</label>
            <select className="sq-input" name="to_status" id={`${fieldId}-to-status`}>{targets.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-reason`}>{s.reasonPh}</label><input className="sq-input" name="reason" id={`${fieldId}-reason`} /></div>
          <button className="btn btn-primary btn-touch" disabled={applying}>{applying ? s.applying : s.apply}</button>
          {tState.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{tState.error}</span>}
          {tState.ok && <span className="badge badge-compliant">{s.done}</span>}
        </form>
      )}
      {targets.length === 0 && <p className="t-caption">{s.noTransitions}</p>}
    </article>
  );
}
