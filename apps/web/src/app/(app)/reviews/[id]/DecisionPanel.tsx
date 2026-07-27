"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { decide, type DecisionResult } from "./actions";

// SB19 — strings built server-side with t() and passed as props.
export type WorkspaceDecisionStrings = {
  heading: string;
  decisions: Record<string, string>;
  returnScopeTitle: string; returnScopeHint: string;
  reason: string; reasonPlaceholder: string;
  comment: string; commentPlaceholder: string;
  approveWarnTitle: string; approveWarnBody: string;
  rejectWarnTitle: string; rejectWarnBody: string;
  confirm: string; recording: string; audited: string;
  reviewConfirmation: string; continueToConfirmation: string; back: string;
  summary: string; version: string; violations: string; criticalViolations: string;
  actionForms: string; evidence: string; factoryUpdates: string;
  compliancePreview: string; approveCompliance: string; returnImpact: string; rejectImpact: string;
};

export type DecisionSummary = {
  version: number;
  violationCount: number;
  criticalViolationCount: number;
  actionFormCount: number;
  evidenceCount: number;
  factoryUpdateCount: number;
};

export default function DecisionPanel({ reviewId, sections, summary, strings }: {
  reviewId: string;
  sections: { key: string; title: string }[];
  summary: DecisionSummary;
  strings: WorkspaceDecisionStrings;
}) {
  const [state, formAction, pending] = useActionState<DecisionResult, FormData>(decide, {});
  const [decision, setDecision] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [returnedSections, setReturnedSections] = useState<string[]>([]);
  const [correlationId] = useState(() => crypto.randomUUID());
  const errorRef = useRef<HTMLDivElement>(null);
  const reasonId = `review-reason-${reviewId}`;
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);
  return (
    <form action={formAction} className="panel" style={{ padding: "var(--space-6)", position: "sticky", insetBlockStart: 16, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <h2>{strings.heading}</h2>
      <input type="hidden" name="review_id" value={reviewId} />
      <input type="hidden" name="correlation_id" value={correlationId} />
      <div className="row" role="radiogroup" aria-label={strings.heading}>
        {["approve", "return", "reject"].map(d => (
          <label key={d} className="sq-choice"><input type="radio" name="decision" value={d} checked={decision === d}
            onChange={() => { setDecision(d); setConfirming(false); setReturnedSections([]); }} /> {strings.decisions[d] ?? d}</label>
        ))}
      </div>
      {decision === "return" && !confirming && (
        <div className="panel" style={{ padding: "var(--space-4)" }}>
          <p className="sq-overline" style={{ marginBlockEnd: 8 }}>{strings.returnScopeTitle}</p>
          {sections.map(s => (
            <label key={s.key} className="sq-choice" style={{ display: "flex" }}><input type="checkbox" name="returned_section" value={s.key}
              checked={returnedSections.includes(s.key)}
              onChange={event => setReturnedSections(current => event.target.checked ? [...current, s.key] : current.filter(key => key !== s.key))} /> {s.title}</label>
          ))}
          <p className="t-caption">{strings.returnScopeHint}</p>
        </div>
      )}
      {!confirming && <div className="sq-field" style={{ maxInlineSize: "none" }}>
        <label className="sq-field__label" htmlFor={reasonId}>{strings.reason} {decision !== "approve" && <span className="sq-req">*</span>}</label>
        <textarea id={reasonId} className="sq-textarea" name="reason" value={reason} onChange={event => setReason(event.target.value)}
          placeholder={strings.reasonPlaceholder} aria-required={decision !== "approve"} />
      </div>}
      {!confirming && <div className="sq-field" style={{ maxInlineSize: "none" }}>
        <label className="sq-field__label" htmlFor={`${reasonId}-comment`}>{strings.comment}</label>
        <textarea id={`${reasonId}-comment`} className="sq-textarea" name="comment" value={comment}
          onChange={event => setComment(event.target.value)} placeholder={strings.commentPlaceholder} />
      </div>}
      {confirming && (
        <section className="panel" style={{ padding: "var(--space-4)" }} aria-labelledby={`${reasonId}-confirmation`}>
          <h3 id={`${reasonId}-confirmation`}>{strings.reviewConfirmation}</h3>
          <dl className="sq-trace__nodes">
            <div className="sq-trace__node"><dt>{strings.version}</dt><dd>v{summary.version}</dd></div>
            <div className="sq-trace__node"><dt>{strings.violations}</dt><dd>{summary.violationCount}</dd></div>
            <div className="sq-trace__node"><dt>{strings.criticalViolations}</dt><dd>{summary.criticalViolationCount}</dd></div>
            <div className="sq-trace__node"><dt>{strings.actionForms}</dt><dd>{summary.actionFormCount}</dd></div>
            <div className="sq-trace__node"><dt>{strings.evidence}</dt><dd>{summary.evidenceCount}</dd></div>
            <div className="sq-trace__node"><dt>{strings.factoryUpdates}</dt><dd>{summary.factoryUpdateCount}</dd></div>
          </dl>
          {decision === "return" && <p><strong>{strings.returnScopeTitle}:</strong> {sections.filter(section => returnedSections.includes(section.key)).map(section => section.title).join(", ")}</p>}
          {reason && <p><strong>{strings.reason}:</strong> {reason}</p>}
          {comment && <p><strong>{strings.comment}:</strong> {comment}</p>}
          <div className={`sq-banner ${decision === "reject" ? "sq-banner--critical" : "sq-banner--warning"}`} role="note">
            <div><strong>{strings.compliancePreview}</strong>{" "}
              {decision === "approve" ? strings.approveCompliance : decision === "return" ? strings.returnImpact : strings.rejectImpact}
            </div>
          </div>
        </section>
      )}
      <input type="hidden" name="reason" value={reason} />
      <input type="hidden" name="comment" value={comment} />
      {returnedSections.map(section => <input key={section} type="hidden" name="returned_section" value={section} />)}
      {state.error && <div ref={errorRef} tabIndex={-1} className="sq-banner sq-banner--critical" role="alert"><div>{state.error}</div></div>}
      {!confirming && decision === "approve" && <div className="sq-banner sq-banner--warning"><div><strong>{strings.approveWarnTitle}</strong> {strings.approveWarnBody}</div></div>}
      {!confirming && decision === "reject" && <div className="sq-banner sq-banner--critical"><div><strong>{strings.rejectWarnTitle}</strong> {strings.rejectWarnBody}</div></div>}
      {confirming ? (
        <div className="row">
          <button type="button" className="btn btn-secondary btn-touch" disabled={pending} onClick={() => setConfirming(false)}>{strings.back}</button>
          <button className={`btn ${decision === "reject" ? "btn-danger" : "btn-primary"} btn-lg btn-touch`} disabled={pending}>{pending ? strings.recording : strings.confirm.replace("{decision}", strings.decisions[decision] ?? decision)}</button>
        </div>
      ) : (
        <button type="button" className={`btn ${decision === "reject" ? "btn-danger" : "btn-primary"} btn-lg btn-touch`}
          disabled={!decision || (decision !== "approve" && !reason.trim()) || (decision === "return" && returnedSections.length === 0)}
          onClick={() => setConfirming(true)}>{strings.continueToConfirmation}</button>
      )}
      <p className="t-caption">{strings.audited}</p>
    </form>
  );
}
