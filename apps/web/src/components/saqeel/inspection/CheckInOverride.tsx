"use client";

import React, { useId, useState } from "react";
import { Field } from "../inputs/Field";
import { Input, TextArea } from "../inputs/Input";

export interface CheckInOverrideValue {
  reason: string;
  explanation: string;
}

export interface CheckInOverrideProps {
  title?: string;
  description?: string;
  reasonLabel?: string;
  explanationLabel?: string;
  confirmationLabel?: string;
  guardLabel?: string;
  submitLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onCancel?: () => void;
  onConfirm: (value: CheckInOverrideValue) => void | Promise<void>;
}

export function isCheckInOverrideReady(value: CheckInOverrideValue, confirmed: boolean) {
  return confirmed && value.reason.trim().length > 0 && value.explanation.trim().length > 0;
}

export function CheckInOverride({
  title = "Override check-in",
  description = "Record a reason and explanation before requesting an override. This does not bypass server authorization or policy checks.",
  reasonLabel = "Reason",
  explanationLabel = "Explanation",
  confirmationLabel = "I confirm this explanation is accurate.",
  guardLabel = "The override remains subject to canonical server-side guards.",
  submitLabel = "Request override",
  cancelLabel = "Cancel",
  pending = false,
  onCancel,
  onConfirm,
}: CheckInOverrideProps) {
  const reasonId = useId();
  const explanationId = useId();
  const [value, setValue] = useState<CheckInOverrideValue>({ reason: "", explanation: "" });
  const [confirmed, setConfirmed] = useState(false);
  const ready = isCheckInOverrideReady(value, confirmed) && !pending;

  return (
    <section className="panel stack" aria-labelledby={`${reasonId}-title`}>
      <header className="panel-header">
        <div className="stack">
          <h2 className="panel-title" id={`${reasonId}-title`}>{title}</h2>
          <p className="t-caption">{description}</p>
        </div>
      </header>
      <form
        className="panel-body stack"
        onSubmit={event => {
          event.preventDefault();
          if (ready) void onConfirm({ reason: value.reason.trim(), explanation: value.explanation.trim() });
        }}
      >
        <div className="alert alert-warning" role="status">{guardLabel}</div>
        <Field label={reasonLabel} htmlFor={reasonId} required>
          <Input
            id={reasonId}
            name="reason"
            required
            value={value.reason}
            onChange={event => setValue(current => ({ ...current, reason: event.target.value }))}
          />
        </Field>
        <Field label={explanationLabel} htmlFor={explanationId} required>
          <TextArea
            id={explanationId}
            name="explanation"
            required
            value={value.explanation}
            onChange={event => setValue(current => ({ ...current, explanation: event.target.value }))}
          />
        </Field>
        <label className="check">
          <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
          <span>{confirmationLabel}</span>
        </label>
        <div className="row">
          {onCancel ? <button className="btn btn-secondary btn-touch" type="button" onClick={onCancel}>{cancelLabel}</button> : null}
          <button className="btn btn-primary btn-touch" type="submit" disabled={!ready} aria-busy={pending}>{submitLabel}</button>
        </div>
      </form>
    </section>
  );
}
