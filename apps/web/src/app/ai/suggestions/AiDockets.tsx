"use client";
import { useActionState } from "react";
import { proposeSuggestion, disposeSuggestion, type AiResult } from "./actions";
import { isDispositionAllowed, AI_DISPOSITIONS, type AiDisposition } from "@/lib/ai/suggestions";

export type AiRow = { id: string; surface: string; text: string; disposition: AiDisposition; provider_status: string };
export type AiStrings = {
  surface: string; text: string; propose: string; proposing: string; proposed: string;
  dispose: string; disposing: string; disposed: string; reason: string;
};

export function AiDockets({ rows, strings: s }: { rows: AiRow[]; strings: AiStrings }) {
  const [pState, pAction, proposing] = useActionState<AiResult, FormData>(proposeSuggestion, {});
  return (
    <>
      <form action={pAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="ax-field"><label className="ax-field__label">{s.surface}</label>
          <select className="ax-input" name="surface"><option>planning</option><option>inspection</option><option>review</option><option>operations</option></select></div>
        <div className="ax-field" style={{ flex: 1 }}><label className="ax-field__label">{s.text}</label><input className="ax-input" name="text" required /></div>
        <button className="ax-btn" disabled={proposing}>{proposing ? s.proposing : s.propose}</button>
        {pState.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{pState.error}</span>}
        {pState.ok && <span className="ax-lozenge ax-lozenge--success">{s.proposed}</span>}
      </form>
      {rows.map((r) => <AiRowView key={r.id} r={r} strings={s} />)}
    </>
  );
}

function AiRowView({ r, strings: s }: { r: AiRow; strings: AiStrings }) {
  const [dState, dAction, disposing] = useActionState<AiResult, FormData>(disposeSuggestion, {});
  const targets = AI_DISPOSITIONS.filter((x) => isDispositionAllowed(r.disposition, x));
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between" }}>
        <h3>{r.surface} <span className="ax-caption">{r.text}</span></h3>
        <div className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
          <span className="ax-lozenge ax-lozenge--info">{r.disposition}</span>
          <span className="ax-lozenge ax-lozenge--warning">{r.provider_status}</span>
        </div>
      </div>
      {targets.length > 0 && (
        <form action={dAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="suggestion_id" value={r.id} />
          <input type="hidden" name="from" value={r.disposition} />
          <div className="ax-field"><label className="ax-field__label">{s.dispose}</label>
            <select className="ax-input" name="to">{targets.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="ax-field"><label className="ax-field__label">{s.reason}</label><input className="ax-input" name="reason" /></div>
          <button className="ax-btn" disabled={disposing}>{disposing ? s.disposing : s.dispose}</button>
          {dState.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{dState.error}</span>}
          {dState.ok && <span className="ax-lozenge ax-lozenge--success">{s.disposed}</span>}
        </form>
      )}
    </div>
  );
}
