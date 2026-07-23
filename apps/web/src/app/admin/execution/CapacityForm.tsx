"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2A — daily visit capacity editor.
// The cap is business-supplied (default 10) and validated server-side.
import { useActionState } from "react";
import { saveDailyCapacity } from "./actions";

export type CapacityLabels = {
  capLabel: string;
  capHint: string;
  save: string;
  saving: string;
  saved: string;
};

type SaveState = { ok?: boolean; error?: string };

export default function CapacityForm({ cap, labels }: { cap: number | null; labels: CapacityLabels }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveDailyCapacity(fd),
    {},
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="sq-field" style={{ maxInlineSize: 240 }}>
        <label className="sq-field__label" htmlFor="daily_visit_cap">{labels.capLabel}</label>
        <input
          className="sq-input sq-numeric" id="daily_visit_cap" name="daily_visit_cap"
          type="number" min={1} step={1} required defaultValue={cap ?? ""}
        />
        <p className="sq-caption" style={{ margin: 0 }}>{labels.capHint}</p>
      </div>
      <div className="sq-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="sq-btn sq-btn--prominent" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.ok && !pending && <span className="sq-lozenge sq-lozenge--success">{labels.saved}</span>}
      </div>
      {state.error && <p className="sq-caption" role="alert" style={{ color: "var(--status-critical-text)", margin: 0 }}>{state.error}</p>}
    </form>
  );
}
