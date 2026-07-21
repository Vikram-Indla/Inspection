"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2A — offline & sync policy editor.
// max_sync_attempts and the autosave interval are NOT business-supplied
// values, so they are optional governed overrides: empty means unset, and
// unset honestly means the platform default applies. No number is invented —
// when a value has never been set the control is empty and labelled
// "platform default".
import { useActionState } from "react";
import { saveOfflinePolicy } from "./actions";

export type OfflineLabels = {
  attemptsLabel: string;
  attemptsHint: string;
  autosaveLabel: string;
  autosaveHint: string;
  currentValue: string;
  platformDefault: string;
  unsetNote: string;
  save: string;
  saving: string;
  saved: string;
};

type SaveState = { ok?: boolean; error?: string };

export default function OfflinePolicyForm({
  maxSyncAttempts,
  autosaveSeconds,
  labels,
}: {
  maxSyncAttempts: number | null;
  autosaveSeconds: number | null;
  labels: OfflineLabels;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveOfflinePolicy(fd),
    {},
  );

  const currentBadge = (value: number | null) => (
    <span className={`ax-lozenge ${value == null ? "ax-lozenge--info" : "ax-lozenge--success"}`}>
      {value == null ? labels.platformDefault : `${labels.currentValue} ${value}`}
    </span>
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="ax-row" style={{ gap: "var(--ax-space-300)", flexWrap: "wrap" }}>
        <div className="ax-field" style={{ maxInlineSize: 280 }}>
          <label className="ax-field__label" htmlFor="max_sync_attempts">{labels.attemptsLabel}</label>
          <input
            className="ax-input ax-numeric" id="max_sync_attempts" name="max_sync_attempts"
            type="number" min={1} max={100} step={1} defaultValue={maxSyncAttempts ?? ""}
            placeholder={labels.platformDefault}
          />
          <p className="ax-caption" style={{ margin: 0 }}>{labels.attemptsHint}</p>
          {currentBadge(maxSyncAttempts)}
        </div>
        <div className="ax-field" style={{ maxInlineSize: 280 }}>
          <label className="ax-field__label" htmlFor="autosave_interval_s">{labels.autosaveLabel}</label>
          <input
            className="ax-input ax-numeric" id="autosave_interval_s" name="autosave_interval_s"
            type="number" min={5} max={600} step={1} defaultValue={autosaveSeconds ?? ""}
            placeholder={labels.platformDefault}
          />
          <p className="ax-caption" style={{ margin: 0 }}>{labels.autosaveHint}</p>
          {currentBadge(autosaveSeconds)}
        </div>
      </div>
      <p className="ax-caption" style={{ margin: 0 }}>{labels.unsetNote}</p>
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
