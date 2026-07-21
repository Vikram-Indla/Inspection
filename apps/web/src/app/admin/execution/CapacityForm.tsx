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
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-field" style={{ maxInlineSize: 240 }}>
        <label className="ax-field__label" htmlFor="daily_visit_cap">{labels.capLabel}</label>
        <input
          className="ax-input ax-numeric" id="daily_visit_cap" name="daily_visit_cap"
          type="number" min={1} step={1} required defaultValue={cap ?? ""}
        />
        <p className="ax-caption" style={{ margin: 0 }}>{labels.capHint}</p>
      </div>
      <div className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "center" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
      </div>
      {state.error && <p className="ax-caption" role="alert" style={{ color: "var(--ax-color-critical-strong)", margin: 0 }}>{state.error}</p>}
    </form>
  );
}
