"use client";
import { useActionState, useId } from "react";
import { createRiskDraft, transitionRiskModel, type RiskResult } from "./actions";
import { isRiskModelTransitionAllowed, RISK_MODEL_STATUSES, type RiskModelStatus } from "@/lib/risk/model";

export type RiskModelRow = { id: string; version_label: string; status: RiskModelStatus; row_version: number };
export type RiskStrings = {
  newLabel: string; payload: string; create: string; creating: string; created: string;
  transition: string; apply: string; applying: string; done: string; reasonPh: string;
};

export function RiskModelsBoard({ rows, strings: s }: { rows: RiskModelRow[]; strings: RiskStrings }) {
  const [cState, cAction, creating] = useActionState<RiskResult, FormData>(createRiskDraft, {});
  return (
    <>
      <form action={cAction} className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="sq-field"><label className="sq-field__label" htmlFor="risk-model-version-label">{s.newLabel}</label>
          <input className="sq-input numeric" name="version_label" id="risk-model-version-label" required /></div>
        <div className="sq-field"><label className="sq-field__label" htmlFor="risk-model-payload">{s.payload}</label>
          <textarea className="sq-input numeric" name="payload" id="risk-model-payload" rows={6} spellCheck={false}
            defaultValue={'{"factors":[{"key":"a","weight":1}],"bands":{"low":[0,39],"medium":[40,69],"high":[70,100]}}'} /></div>
        <div className="row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
          <button className="btn btn-primary btn-touch" disabled={creating}>{creating ? s.creating : s.create}</button>
          {cState.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{cState.error}</span>}
          {cState.ok && <span className="badge badge-compliant">{s.created}</span>}
        </div>
      </form>
      {rows.map((m) => <RiskRow key={m.id} m={m} strings={s} />)}
    </>
  );
}

function RiskRow({ m, strings: s }: { m: RiskModelRow; strings: RiskStrings }) {
  const [tState, tAction, applying] = useActionState<RiskResult, FormData>(transitionRiskModel, {});
  const fieldId = useId();
  const targets = RISK_MODEL_STATUSES.filter((x) => isRiskModelTransitionAllowed(m.status, x));
  return (
    <div className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{m.version_label} <span className="sq-version">v{m.row_version}</span></h3>
        <span className="badge badge-info">{m.status}</span>
      </div>
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
    </div>
  );
}
