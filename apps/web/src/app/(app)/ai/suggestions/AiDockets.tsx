"use client";
import { useActionState, useId } from "react";
import { proposeSuggestion, disposeSuggestion, generateAiSuggestion, type AiResult } from "./actions";
import { isDispositionAllowed, isTerminalDisposition, AI_DISPOSITIONS, type AiDisposition } from "@/lib/ai/suggestions";

export type AiRow = { id: string; surface: string; text: string; disposition: AiDisposition; provider_status: string; evidenceRefs: string[]; clauseRefs: string[]; confidence: number | null };
export type AiStrings = {
  surface: string; text: string; propose: string; proposing: string; proposed: string;
  dispose: string; disposing: string; disposed: string; applyDisposition: string;
  reason: string; reasonHint: string;
  context: string; generate: string; generating: string; generated: string;
  generateTitle: string; proposeTitle: string;
  contextHint: string; textHint: string; evidenceHint: string; clauseHint: string;
  evidenceRefs: string; clauseRefs: string; evidenceRefsLong: string; clauseRefsLong: string;
  confidence: string; confidenceUnavailable: string; confidenceUnverified: string;
  terminal: string; providerReady: string; providerHeld: string;
  generateHintReady: string; generateHintHeld: string;
};

// The four advisory surfaces are the source enum (lib/ai/suggestions guardrail
// refuses legal surfaces); they are ids, not translated labels.
const SURFACES = ["planning", "inspection", "review", "operations"] as const;

// Design grid: Surface / free text / evidence refs / clause refs / action.
const FORM_GRID: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "160px minmax(0, 1fr) 150px 140px auto",
  gap: "var(--space-3)", alignItems: "end",
};

/** Disposition and provider state map onto the shared status badge scale. */
function dispositionBadge(d: AiDisposition): string {
  if (d === "accepted") return "badge-compliant";
  if (d === "proposed") return "badge-info";
  return "badge-draft"; // rejected / superseded are terminal, not alarming
}
function providerBadge(status: string): string {
  if (status === "configured") return "badge-warning"; // machine-generated — read with care
  if (status === "unavailable") return "badge-critical"; // fail-closed
  return "badge-draft"; // human-proposed and any other recorded state
}

export function AiDockets({ rows, strings: s, providerConfigured }: { rows: AiRow[]; strings: AiStrings; providerConfigured: boolean }) {
  const [pState, pAction, proposing] = useActionState<AiResult, FormData>(proposeSuggestion, {});
  const [gState, gAction, generating] = useActionState<AiResult, FormData>(generateAiSuggestion, {});
  const genId = useId();
  const propId = useId();
  return (
    <>
      {/* Generate (AI) — fail-closed: the control is disabled while the provider
          is held, and the server action refuses independently of this UI. */}
      <form action={gAction} className="panel" style={{ padding: "var(--space-5)" }}>
        <div className="row" style={{ gap: "var(--space-2)", marginBlockEnd: "var(--space-3)" }}>
          <h2 style={{ margin: 0 }}>{s.generateTitle}</h2>
          <span className={`badge ${providerConfigured ? "badge-compliant" : "badge-critical"}`}>{providerConfigured ? s.providerReady : s.providerHeld}</span>
        </div>
        <div style={FORM_GRID}>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${genId}-surface`}>{s.surface}</label>
            <select className="sq-input" name="surface" id={`${genId}-surface`} disabled={!providerConfigured}>{SURFACES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${genId}-context`}>{s.context}</label>
            <input className="sq-input" name="context" id={`${genId}-context`} placeholder={s.contextHint} disabled={!providerConfigured} /></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${genId}-evidence`}>{s.evidenceRefs} <span aria-hidden="true" style={{ color: "var(--status-critical-text)" }}>*</span></label>
            <input className="sq-input" name="evidence_refs" id={`${genId}-evidence`} placeholder={s.evidenceHint} required disabled={!providerConfigured} /></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${genId}-clause`}>{s.clauseRefs}</label>
            <input className="sq-input" name="clause_refs" id={`${genId}-clause`} placeholder={s.clauseHint} disabled={!providerConfigured} /></div>
          <button className="btn btn-primary btn-touch" disabled={generating || !providerConfigured}>{generating ? s.generating : s.generate}</button>
        </div>
        <p className="t-caption" style={{ margin: "var(--space-3) 0 0", color: providerConfigured ? "var(--text-muted)" : "var(--status-critical-text)" }}>
          {providerConfigured ? s.generateHintReady : s.generateHintHeld}
        </p>
        {gState.error && <p className="t-caption" style={{ color: "var(--status-critical-text)", margin: "var(--space-2) 0 0" }} role="alert">{gState.error}</p>}
        {gState.ok && <p style={{ margin: "var(--space-2) 0 0" }}><span className="badge badge-compliant">{s.generated}</span></p>}
      </form>

      {/* Propose (human) — always available, provider or not. */}
      <form action={pAction} className="panel" style={{ padding: "var(--space-5)" }}>
        <h2 style={{ margin: "0 0 var(--space-3)" }}>{s.proposeTitle}</h2>
        <div style={FORM_GRID}>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${propId}-surface`}>{s.surface}</label>
            <select className="sq-input" name="surface" id={`${propId}-surface`}>{SURFACES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${propId}-text`}>{s.text} <span aria-hidden="true" style={{ color: "var(--status-critical-text)" }}>*</span></label>
            <input className="sq-input" name="text" id={`${propId}-text`} placeholder={s.textHint} required /></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${propId}-evidence`}>{s.evidenceRefs} <span aria-hidden="true" style={{ color: "var(--status-critical-text)" }}>*</span></label>
            <input className="sq-input" name="evidence_refs" id={`${propId}-evidence`} placeholder={s.evidenceHint} required /></div>
          <div className="sq-field"><label className="sq-field__label" htmlFor={`${propId}-clause`}>{s.clauseRefs}</label>
            <input className="sq-input" name="clause_refs" id={`${propId}-clause`} placeholder={s.clauseHint} /></div>
          <button className="btn btn-secondary btn-touch" disabled={proposing}>{proposing ? s.proposing : s.propose}</button>
        </div>
        {pState.error && <p className="t-caption" style={{ color: "var(--status-critical-text)", margin: "var(--space-3) 0 0" }} role="alert">{pState.error}</p>}
        {pState.ok && <p style={{ margin: "var(--space-3) 0 0" }}><span className="badge badge-compliant">{s.proposed}</span></p>}
      </form>

      {rows.map((r) => <AiRowView key={r.id} r={r} strings={s} />)}
    </>
  );
}

function AiRowView({ r, strings: s }: { r: AiRow; strings: AiStrings }) {
  const [dState, dAction, disposing] = useActionState<AiResult, FormData>(disposeSuggestion, {});
  const fieldId = useId();
  // Only the transitions the source state machine allows are offered — and the
  // server action re-checks them, so the select is convenience, not authority.
  const targets = AI_DISPOSITIONS.filter((x) => isDispositionAllowed(r.disposition, x));
  const terminal = isTerminalDisposition(r.disposition);
  return (
    <div id={`ai-suggestion-${r.id}`} className="panel" style={{ padding: "var(--space-5)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
        <div className="row" style={{ gap: "var(--space-2)", minInlineSize: 0 }}>
          <span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{r.surface}</span>
          <h3 style={{ margin: 0 }}>{r.text}</h3>
        </div>
        <div className="row" style={{ gap: "var(--space-2)", flex: "none" }}>
          <span className={`badge ${dispositionBadge(r.disposition)}`}>{r.disposition}</span>
          <span className={`badge ${providerBadge(r.provider_status)}`}>{r.provider_status}</span>
        </div>
      </div>
      <dl className="row" style={{ gap: "var(--space-8)", flexWrap: "wrap", margin: "var(--space-4) 0 0" }}>
        <div><dt className="t-label">{s.evidenceRefsLong}</dt>
          <dd style={{ margin: "2px 0 0" }}><span className="id-code">{r.evidenceRefs.length ? r.evidenceRefs.join(" · ") : "—"}</span></dd></div>
        <div><dt className="t-label">{s.clauseRefsLong}</dt>
          <dd style={{ margin: "2px 0 0" }}><span className="id-code">{r.clauseRefs.length ? r.clauseRefs.join(" · ") : "—"}</span></dd></div>
        <div><dt className="t-label">{s.confidence}</dt>
          <dd style={{ margin: "2px 0 0", color: r.confidence == null ? "var(--text-muted)" : "var(--status-compliant-text)" }}>
            {r.confidence == null ? s.confidenceUnavailable : `${Math.round(r.confidence * 100)}% ${s.confidenceUnverified}`}
          </dd></div>
      </dl>
      <div style={{ marginBlockStart: "var(--space-4)", paddingBlockStart: "var(--space-4)", borderBlockStart: "1px solid var(--border-subtle)" }}>
        {terminal || targets.length === 0
          ? <span className="t-caption" style={{ color: "var(--text-muted)" }}>{s.terminal}</span>
          : (
            <form action={dAction} className="row" style={{ gap: "var(--space-3)", alignItems: "flex-end", flexWrap: "wrap" }}>
              <input type="hidden" name="suggestion_id" value={r.id} />
              <input type="hidden" name="from" value={r.disposition} />
              <div className="sq-field"><label className="sq-field__label" htmlFor={`${fieldId}-dispose`}>{s.dispose}</label>
                <select className="sq-input" name="to" id={`${fieldId}-dispose`} style={{ minInlineSize: 180 }}>{targets.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="sq-field" style={{ flex: 1, minInlineSize: 200 }}><label className="sq-field__label" htmlFor={`${fieldId}-reason`}>{s.reason}</label>
                <input className="sq-input" name="reason" id={`${fieldId}-reason`} placeholder={s.reasonHint} /></div>
              <button className="btn btn-primary btn-touch" disabled={disposing}>{disposing ? s.disposing : s.applyDisposition}</button>
              {dState.error && <span className="t-caption" style={{ color: "var(--status-critical-text)" }} role="alert">{dState.error}</span>}
              {dState.ok && <span className="badge badge-compliant">{s.disposed}</span>}
            </form>
          )}
      </div>
    </div>
  );
}
