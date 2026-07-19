"use client";
import { useActionState, useId } from "react";
import { proposeSuggestion, disposeSuggestion, generateAiSuggestion, type AiResult } from "./actions";
import { isDispositionAllowed, AI_DISPOSITIONS, type AiDisposition } from "@/lib/ai/suggestions";

export type AiRow = { id: string; surface: string; text: string; disposition: AiDisposition; provider_status: string; evidenceRefs: string[]; clauseRefs: string[]; confidence: number | null };
export type AiStrings = {
  surface: string; text: string; propose: string; proposing: string; proposed: string;
  dispose: string; disposing: string; disposed: string; reason: string;
  context: string; generate: string; generating: string; generated: string;
  evidenceRefs: string; clauseRefs: string; confidence: string; confidenceUnavailable: string;
};

export function AiDockets({ rows, strings: s }: { rows: AiRow[]; strings: AiStrings }) {
  const [pState, pAction, proposing] = useActionState<AiResult, FormData>(proposeSuggestion, {});
  const [gState, gAction, generating] = useActionState<AiResult, FormData>(generateAiSuggestion, {});
  return (
    <>
      {/* Gemini-generated advisory suggestion — fail-closed, human still disposes */}
      <form action={gAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="ax-field"><label className="ax-field__label" htmlFor="ai-generate-surface">{s.surface}</label>
          <select className="ax-input" name="surface" id="ai-generate-surface"><option>planning</option><option>inspection</option><option>review</option><option>operations</option></select></div>
        <div className="ax-field" style={{ flex: 1 }}><label className="ax-field__label" htmlFor="ai-generate-context">{s.context}</label><input className="ax-input" name="context" id="ai-generate-context" /></div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="ai-generate-evidence">{s.evidenceRefs}</label><input className="ax-input" name="evidence_refs" id="ai-generate-evidence" required /></div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="ai-generate-clause">{s.clauseRefs}</label><input className="ax-input" name="clause_refs" id="ai-generate-clause" /></div>
        <button className="ax-btn" disabled={generating}>{generating ? s.generating : s.generate}</button>
        {gState.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{gState.error}</span>}
        {gState.ok && <span className="ax-lozenge ax-lozenge--success">{s.generated}</span>}
      </form>
      <form action={pAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="ax-field"><label className="ax-field__label" htmlFor="ai-propose-surface">{s.surface}</label>
          <select className="ax-input" name="surface" id="ai-propose-surface"><option>planning</option><option>inspection</option><option>review</option><option>operations</option></select></div>
        <div className="ax-field" style={{ flex: 1 }}><label className="ax-field__label" htmlFor="ai-propose-text">{s.text}</label><input className="ax-input" name="text" id="ai-propose-text" required /></div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="ai-propose-evidence">{s.evidenceRefs}</label><input className="ax-input" name="evidence_refs" id="ai-propose-evidence" required /></div>
        <div className="ax-field"><label className="ax-field__label" htmlFor="ai-propose-clause">{s.clauseRefs}</label><input className="ax-input" name="clause_refs" id="ai-propose-clause" /></div>
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
  const fieldId = useId();
  const targets = AI_DISPOSITIONS.filter((x) => isDispositionAllowed(r.disposition, x));
  return (
    <div id={`ai-suggestion-${r.id}`} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between" }}>
        <h3>{r.surface} <span className="ax-caption">{r.text}</span></h3>
        <div className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
          <span className="ax-lozenge ax-lozenge--info">{r.disposition}</span>
          <span className="ax-lozenge ax-lozenge--warning">{r.provider_status}</span>
        </div>
      </div>
      <dl className="ax-row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap" }}>
        <div><dt className="ax-caption">{s.evidenceRefs}</dt><dd>{r.evidenceRefs.length ? r.evidenceRefs.join(" · ") : "—"}</dd></div>
        <div><dt className="ax-caption">{s.clauseRefs}</dt><dd>{r.clauseRefs.length ? r.clauseRefs.join(" · ") : "—"}</dd></div>
        <div><dt className="ax-caption">{s.confidence}</dt><dd>{r.confidence == null ? s.confidenceUnavailable : `${Math.round(r.confidence * 100)}%`}</dd></div>
      </dl>
      {targets.length > 0 && (
        <form action={dAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="suggestion_id" value={r.id} />
          <input type="hidden" name="from" value={r.disposition} />
          <div className="ax-field"><label className="ax-field__label" htmlFor={`${fieldId}-dispose`}>{s.dispose}</label>
            <select className="ax-input" name="to" id={`${fieldId}-dispose`}>{targets.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="ax-field"><label className="ax-field__label" htmlFor={`${fieldId}-reason`}>{s.reason}</label><input className="ax-input" name="reason" id={`${fieldId}-reason`} /></div>
          <button className="ax-btn" disabled={disposing}>{disposing ? s.disposing : s.dispose}</button>
          {dState.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{dState.error}</span>}
          {dState.ok && <span className="ax-lozenge ax-lozenge--success">{s.disposed}</span>}
        </form>
      )}
    </div>
  );
}
