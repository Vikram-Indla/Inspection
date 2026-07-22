"use client";
// TASK-EXECUTION-MODULE-001 · Phase 2A — visit mode eligibility editor.
// Fail-closed semantics: a mode not enabled here is never offered to anyone.
// Self-assessment is gated to Release 2 (BRD) — the toggle is disabled in the
// UI and the server action refuses to enable it regardless of what is posted.
import { useActionState } from "react";
import { saveVisitModes } from "./actions";

export type VisitModesValue = {
  physical: { enabled: boolean };
  virtual: { enabled: boolean; requires_otp: boolean; requires_appointment: boolean };
  self_assessment: { enabled: boolean; release_gate: string };
};

export type VisitModesLabels = {
  physical: string;
  virtual: string;
  virtualOtp: string;
  virtualAppointment: string;
  selfAssessment: string;
  selfAssessmentGate: string;
  failClosedNote: string;
  save: string;
  saving: string;
  saved: string;
};

type SaveState = { ok?: boolean; error?: string };

export default function VisitModesForm({ modes, labels }: { modes: VisitModesValue; labels: VisitModesLabels }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    async (_prev, fd) => await saveVisitModes(fd),
    {},
  );

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <label className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <input type="checkbox" name="physical_enabled" defaultChecked={modes.physical.enabled} />
        <span>{labels.physical}</span>
      </label>

      <label className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <input type="checkbox" name="virtual_enabled" defaultChecked={modes.virtual.enabled} />
        <span>{labels.virtual}</span>
      </label>
      <div style={{ paddingInlineStart: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <label className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
          <input type="checkbox" name="virtual_requires_otp" defaultChecked={modes.virtual.requires_otp} />
          <span>{labels.virtualOtp}</span>
        </label>
        <label className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
          <input type="checkbox" name="virtual_requires_appointment" defaultChecked={modes.virtual.requires_appointment} />
          <span>{labels.virtualAppointment}</span>
        </label>
      </div>

      <label className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <input type="checkbox" name="self_assessment_enabled" disabled checked={false} readOnly />
        <span>{labels.selfAssessment}</span>
        <span className="ax-lozenge ax-lozenge--info">{labels.selfAssessmentGate}</span>
      </label>

      <p className="ax-caption" style={{ margin: 0 }}>{labels.failClosedNote}</p>

      <div className="ax-row" style={{ gap: "var(--space-3)", alignItems: "center" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </button>
        {state.ok && !pending && <span className="ax-lozenge ax-lozenge--success">{labels.saved}</span>}
      </div>
      {state.error && <p className="ax-caption" role="alert" style={{ color: "var(--status-critical-text)", margin: 0 }}>{state.error}</p>}
    </form>
  );
}
