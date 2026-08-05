"use client";
import { useActionState } from "react";
import { updateActionFormStatus, markNotificationHandled, type OpsResult } from "./actions";

// Server-built strings (strings-prop pattern — client components cannot call useT()).
export type ActionFormControlsStrings = {
  acknowledge: string;
  close: string;
  updated: string;
};

export type MarkHandledStrings = {
  markHandled: string;
  handled: string;
};

// SB12 — acknowledge / close controls for the corrective actions queue (RLS actions_rw).
export function ActionFormControls({ actionFormId, status, strings }: { actionFormId: string; status: string; strings: ActionFormControlsStrings }) {
  const [state, formAction, pending] = useActionState<OpsResult, FormData>(updateActionFormStatus, {});
  return (
    <form action={formAction} className="row" style={{ gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="action_form_id" value={actionFormId} />
      {status === "open" && (
        <button className="btn btn-primary btn-touch" name="next_status" value="acknowledged" disabled={pending}>
          {pending ? "…" : strings.acknowledge}
        </button>
      )}
      <button className="btn btn-primary btn-lg btn-touch" name="next_status" value="closed" disabled={pending}>
        {pending ? "…" : strings.close}
      </button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant">{strings.updated}</span>}
    </form>
  );
}

// ENG-11 — mark-handled control for the notifications panel (delivery_state column).
export function MarkNotificationHandled({ notificationId, strings }: { notificationId: string; strings: MarkHandledStrings }) {
  const [state, formAction, pending] = useActionState<OpsResult, FormData>(markNotificationHandled, {});
  return (
    <form action={formAction} className="row" style={{ gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="notification_id" value={notificationId} />
      <button className="btn btn-secondary btn-touch" disabled={pending}>{pending ? "…" : strings.markHandled}</button>
      {state.error && <span className="t-caption" style={{ color: "var(--status-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="badge badge-compliant">{strings.handled}</span>}
    </form>
  );
}
