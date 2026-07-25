"use client";

import { useActionState, useState } from "react";
import { recordEnforcementDecision, type EnforcementDecisionResult } from "./actions";

type Strings = {
  approve: string;
  reject: string;
  reason: string;
  reasonPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  errors: Record<NonNullable<EnforcementDecisionResult["error"]>, string>;
};

export default function EnforcementDecisionForm({
  recommendationId,
  strings,
}: {
  recommendationId: string;
  strings: Strings;
}) {
  const [state, action, pending] = useActionState<EnforcementDecisionResult, FormData>(
    recordEnforcementDecision,
    {},
  );
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");

  return (
    <form action={action} className="stack" style={{ gap: "var(--space-3)" }}>
      <input type="hidden" name="recommendation_id" value={recommendationId} />
      <div className="row" style={{ gap: "var(--space-4)", flexWrap: "wrap" }}>
        <label className="sq-choice">
          <input
            type="radio"
            name="decision"
            value="approved"
            checked={decision === "approved"}
            onChange={() => setDecision("approved")}
          />{" "}
          {strings.approve}
        </label>
        <label className="sq-choice">
          <input
            type="radio"
            name="decision"
            value="rejected"
            checked={decision === "rejected"}
            onChange={() => setDecision("rejected")}
          />{" "}
          {strings.reject}
        </label>
      </div>
      <label className="sq-field">
        <span className="sq-field__label">{strings.reason}</span>
        <textarea
          className="sq-textarea"
          name="decision_reason"
          rows={2}
          required
          maxLength={2000}
          placeholder={strings.reasonPlaceholder}
        />
      </label>
      {state.error ? (
        <div className="sq-banner sq-banner--critical" role="alert">
          <div>{strings.errors[state.error]}</div>
        </div>
      ) : null}
      {state.ok ? (
        <div className="sq-banner" role="status">
          <div>{strings.success}</div>
        </div>
      ) : null}
      <button type="submit" className="btn btn-primary btn-touch" disabled={pending}>
        {pending ? strings.submitting : strings.submit}
      </button>
    </form>
  );
}
