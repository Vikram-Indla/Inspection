"use client";
// FIX WAVE F4 — M02-043: add/edit visit notes from web Visit Management.
// Guarded server action updates visits.notes; RLS visits_update (planner/ops)
// is the authority and its verdict is surfaced verbatim.
import { useActionState } from "react";
import { updateVisitNotes, type ActionResult } from "./actions";

export type NotesStrings = {
  heading: string;
  label: string;
  placeholder: string;
  saveBtn: string;
  saving: string;
  hint: string;
};

export default function NotesEditor({ visitId, initialNotes, strings }: {
  visitId: string;
  initialNotes: string;
  strings: NotesStrings;
}) {
  const [state, act, pending] = useActionState<ActionResult, FormData>(updateVisitNotes, {});
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>
      <form action={act} style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
        <input type="hidden" name="visit_id" value={visitId} />
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="visit-notes">{strings.label}</label>
          <textarea className="ax-textarea" name="notes" id="visit-notes" rows={3} defaultValue={initialNotes} placeholder={strings.placeholder} />
        </div>
        <div className="row" style={{ alignItems: "center", gap: "var(--ax-space-150)" }}>
          <button className="ax-btn ax-btn--secondary" disabled={pending}>{pending ? strings.saving : strings.saveBtn}</button>
          <span className="ax-caption">{strings.hint}</span>
        </div>
      </form>
      {state.error && <div className="ax-banner ax-banner--critical"><div>{state.error}</div></div>}
      {state.ok && <div className="ax-banner ax-banner--success"><div>{state.ok}</div></div>}
    </div>
  );
}
