"use client";
import { useActionState } from "react";
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
      <form action={cAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <div className="ax-field"><label className="ax-field__label">{s.newLabel}</label>
          <input className="ax-input ax-numeric" name="version_label" required /></div>
        <div className="ax-field"><label className="ax-field__label">{s.payload}</label>
          <textarea className="ax-input ax-numeric" name="payload" rows={6} spellCheck={false}
            defaultValue={'{"factors":[{"key":"a","weight":1}],"bands":{"low":[0,39],"medium":[40,69],"high":[70,100]}}'} /></div>
        <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
          <button className="ax-btn" disabled={creating}>{creating ? s.creating : s.create}</button>
          {cState.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{cState.error}</span>}
          {cState.ok && <span className="ax-lozenge ax-lozenge--success">{s.created}</span>}
        </div>
      </form>
      {rows.map((m) => <RiskRow key={m.id} m={m} strings={s} />)}
    </>
  );
}

function RiskRow({ m, strings: s }: { m: RiskModelRow; strings: RiskStrings }) {
  const [tState, tAction, applying] = useActionState<RiskResult, FormData>(transitionRiskModel, {});
  const targets = RISK_MODEL_STATUSES.filter((x) => isRiskModelTransitionAllowed(m.status, x));
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between" }}>
        <h3>{m.version_label} <span className="ax-version">v{m.row_version}</span></h3>
        <span className="ax-lozenge ax-lozenge--info">{m.status}</span>
      </div>
      {targets.length > 0 && (
        <form action={tAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="model_id" value={m.id} />
          <input type="hidden" name="from_status" value={m.status} />
          <input type="hidden" name="row_version" value={m.row_version} />
          <div className="ax-field"><label className="ax-field__label">{s.transition}</label>
            <select className="ax-input" name="to_status">{targets.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="ax-field"><label className="ax-field__label">{s.reasonPh}</label><input className="ax-input" name="reason" /></div>
          <button className="ax-btn" disabled={applying}>{applying ? s.applying : s.apply}</button>
          {tState.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{tState.error}</span>}
          {tState.ok && <span className="ax-lozenge ax-lozenge--success">{s.done}</span>}
        </form>
      )}
    </div>
  );
}
