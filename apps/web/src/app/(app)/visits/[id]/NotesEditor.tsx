"use client";
// FIX WAVE F4 — M02-043: add/edit visit notes from web Visit Management.
// Guarded server action updates visits.notes; RLS visits_update (planner/ops)
// is the authority and its verdict is surfaced verbatim.
import { useActionState, useState } from "react";
import { updateVisitNotes, type ActionResult } from "./actions";

export type NotesStrings = {
  heading: string;
  label: string;
  placeholder: string;
  saveBtn: string;
  saving: string;
  hint: string;
};

export default function NotesEditor({ visitId, planningVersion, initialNotes, strings }: {
  visitId: string;
  planningVersion: number;
  initialNotes: string;
  strings: NotesStrings;
}) {
  const [state, act, pending] = useActionState<ActionResult, FormData>(updateVisitNotes, {});
  const [identity] = useState(() => ({
    idempotencyKey: `visit.metadata.notes.${crypto.randomUUID()}`,
    correlationId: crypto.randomUUID(),
  }));
  return (
    <div className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>
      <form action={act} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <input type="hidden" name="visit_id" value={visitId} />
        <input type="hidden" name="expected_version" value={planningVersion} />
        <input type="hidden" name="idempotency_key" value={identity.idempotencyKey} />
        <input type="hidden" name="correlation_id" value={identity.correlationId} />
        <div className="field">
          <label className="sq-field__label" htmlFor="visit-notes">{strings.label}</label>
          <textarea className="sq-textarea" name="notes" id="visit-notes" rows={3} defaultValue={initialNotes} placeholder={strings.placeholder} />
        </div>
        <div className="row" style={{ alignItems: "center", gap: "var(--space-3)" }}>
          <button className="btn btn-secondary btn-touch" disabled={pending}>{pending ? strings.saving : strings.saveBtn}</button>
          <span className="t-caption">{strings.hint}</span>
        </div>
      </form>
      {state.error && <div className="sq-banner sq-banner--critical"><div>{state.error}</div></div>}
      {state.ok && <div className="sq-banner sq-banner--success"><div>{state.ok}</div></div>}
    </div>
  );
}
