"use client";
// FIX WAVE F4 · M02-043 — add/edit visit notes. Server action updateVisitNotes
// owns the write; RLS visits_update (planner/ops) is the authority. Empty
// input clears notes (server treats "" as null).
import { useActionState } from "react";
import { updateVisitNotes, type ActionResult } from "./actions";

// SB19 — strings built server-side with t() and passed as props.
export type NotesStrings = {
  heading: string;
  label: string;
  placeholder: string;
  saveBtn: string;
  saving: string;
  hint: string;
};

export default function NotesEditor({ visitId, initialNotes, strings }: {
  visitId: string; initialNotes: string; strings: NotesStrings;
}) {
  const [state, act, pending] = useActionState<ActionResult, FormData>(updateVisitNotes, {});
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4>{strings.heading}</h4>
      <form action={act} style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
        <input type="hidden" name="visit_id" value={visitId} />
        <div className="ax-field" style={{ maxInlineSize: "none" }}>
          <label className="ax-field__label" htmlFor="visit-notes">{strings.label}</label>
          <textarea id="visit-notes" className="ax-input" name="notes" rows={4}
            placeholder={strings.placeholder} defaultValue={initialNotes} />
        </div>
        <div className="ax-row" style={{ alignItems: "center", gap: "var(--ax-space-200)", flexWrap: "wrap" }}>
          <button className="ax-btn ax-btn--secondary" disabled={pending}>{pending ? strings.saving : strings.saveBtn}</button>
          <span className="ax-caption">{strings.hint}</span>
        </div>
      </form>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert"><div>{state.error}</div></div>}
      {state.ok && <div className="ax-banner ax-banner--success" role="status"><div>{state.ok}</div></div>}
    </div>
  );
}
