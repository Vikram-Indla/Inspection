"use client";
// SB05 — management actions: cancel (M02-006), reschedule (M02-008), reassign (M02-009/ENG-05)
import { useActionState } from "react";
import { returnVisit, republishVisit, cancelVisit, rescheduleVisit, reassignVisit, type ActionResult } from "./actions";

type I = { user_id: string; full_name: string };

// SB19 — strings built server-side with t() and passed as props.
export type ActionBarStrings = {
  heading: string; returnReason: string; returnPlaceholder: string; returnBtn: string;
  republishBtn: string; reassignTo: string; reassignBtn: string;
  newWindowStart: string; newWindowEnd: string; rescheduleBtn: string;
  cancelReason: string; cancelPlaceholder: string; cancelBtn: string;
  executionStarted: string; finalState: string;
};

export default function ActionBar({ visitId, status, opState, opStateLabel, windowStart, windowEnd, inspectors, strings }: {
  visitId: string; status: string; opState: string; opStateLabel: string; windowStart: string; windowEnd: string; inspectors: I[]; strings: ActionBarStrings;
}) {
  const [ret, retAct, p1] = useActionState<ActionResult, FormData>(returnVisit, {});
  const [rep, repAct, p2] = useActionState<ActionResult, FormData>(republishVisit, {});
  const [can, canAct, p3] = useActionState<ActionResult, FormData>(cancelVisit, {});
  const [rsc, rscAct, p4] = useActionState<ActionResult, FormData>(rescheduleVisit, {});
  const [rea, reaAct, p5] = useActionState<ActionResult, FormData>(reassignVisit, {});
  const msg = ret.error ?? rep.error ?? can.error ?? rsc.error ?? rea.error;
  const ok = ret.ok ?? rep.ok ?? can.ok ?? rsc.ok ?? rea.ok;
  const busy = p1 || p2 || p3 || p4 || p5;
  const canCancelReschedule = status === "published" && opState === "new"; // M02-006 / M02-008 guard, mirrored server-side
  const toLocal = (iso: string) => { return iso ? new Date(iso).toISOString().slice(0, 16) : ""; };
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4>{strings.heading}</h4>
      <div className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
        {status === "published" && (
          <form action={retAct} className="ax-row" style={{ alignItems: "flex-end" }}>
            <input type="hidden" name="visit_id" value={visitId} />
            <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label">{strings.returnReason}</label>
              <input className="ax-input" name="reason" placeholder={strings.returnPlaceholder} /></div>
            <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.returnBtn}</button>
          </form>
        )}
        {status === "returned" && (
          <form action={repAct}><input type="hidden" name="visit_id" value={visitId} />
            <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.republishBtn}</button></form>
        )}
        {["published", "returned"].includes(status) && (
          <form action={reaAct} className="ax-row" style={{ alignItems: "flex-end" }}>
            <input type="hidden" name="visit_id" value={visitId} />
            <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label">{strings.reassignTo}</label>
              <select className="ax-select" name="inspector_id"><option value="">—</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
            <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.reassignBtn}</button>
          </form>
        )}
        {canCancelReschedule && (
          <>
            <form action={rscAct} className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label">{strings.newWindowStart}</label>
                <input className="ax-input ax-numeric" type="datetime-local" name="window_start" defaultValue={toLocal(windowStart)} /></div>
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label">{strings.newWindowEnd}</label>
                <input className="ax-input ax-numeric" type="datetime-local" name="window_end" defaultValue={toLocal(windowEnd)} /></div>
              <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.rescheduleBtn}</button>
            </form>
            <form action={canAct} className="ax-row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label">{strings.cancelReason}</label>
                <input className="ax-input" name="reason" placeholder={strings.cancelPlaceholder} /></div>
              <button className="ax-btn ax-btn--danger" disabled={busy}>{strings.cancelBtn}</button>
            </form>
          </>
        )}
        {status === "published" && opState !== "new" && (
          <span className="ax-lozenge ax-lozenge--warning">{strings.executionStarted.replace("{state}", opStateLabel)}</span>
        )}
        {["cancelled", "expired"].includes(status) && <span className="ax-lozenge">{strings.finalState}</span>}
      </div>
      {msg && <div className="ax-banner ax-banner--critical"><div>{msg}</div></div>}
      {ok && <div className="ax-banner ax-banner--success"><div>{ok}</div></div>}
    </div>
  );
}
