"use client";
// M05-002 — appointment scheduling for a published virtual visit.
// SB19 — strings built server-side with t() and passed as props.
import { useActionState } from "react";
import { scheduleSession, type VirtualActionResult } from "./actions";

export type ScheduleFormStrings = {
  appointment: string; repName: string; repNamePh: string; submit: string; working: string;
};

export default function ScheduleForm({ visitId, strings }: { visitId: string; strings: ScheduleFormStrings }) {
  const [state, formAction, pending] = useActionState<VirtualActionResult, FormData>(scheduleSession, {});
  return (
    <form action={formAction} className="row" style={{ alignItems: "flex-end" }}>
      <input type="hidden" name="visit_id" value={visitId} />
      <div className="ax-field"><label className="ax-field__label" htmlFor="schedule-appointment">{strings.appointment}</label>
        <input className="ax-input ax-numeric" type="datetime-local" name="appointment_at" id="schedule-appointment" required /></div>
      <div className="ax-field"><label className="ax-field__label" htmlFor="schedule-rep-name">{strings.repName}</label>
        <input className="ax-input" name="rep_name" id="schedule-rep-name" placeholder={strings.repNamePh} required /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.working : strings.submit}</button>
      {state.error && <div className="ax-banner ax-banner--critical" role="alert" style={{ flexBasis: "100%" }}><div>{state.error}</div></div>}
      {state.ok && <div className="ax-banner ax-banner--success" style={{ flexBasis: "100%" }}><div>{state.ok}</div></div>}
    </form>
  );
}
