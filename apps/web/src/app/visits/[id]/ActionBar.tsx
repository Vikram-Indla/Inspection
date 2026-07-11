"use client";
import { useActionState } from "react";
import { returnVisit, republishVisit, cancelVisit, reassignVisit, type ActionResult } from "./actions";

type I = { user_id: string; full_name: string };

export default function ActionBar({ visitId, status, inspectors }: { visitId: string; status: string; inspectors: I[] }) {
  const [ret, retAct, p1] = useActionState<ActionResult, FormData>(returnVisit, {});
  const [rep, repAct, p2] = useActionState<ActionResult, FormData>(republishVisit, {});
  const [can, canAct, p3] = useActionState<ActionResult, FormData>(cancelVisit, {});
  const [rea, reaAct, p4] = useActionState<ActionResult, FormData>(reassignVisit, {});
  const msg = ret.error ?? rep.error ?? can.error ?? rea.error;
  const ok = ret.ok ?? rep.ok ?? can.ok ?? rea.ok;
  const busy = p1 || p2 || p3 || p4;
  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <h4>Operations — state-guarded (only valid transitions succeed)</h4>
      <div className="ax-row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
        {status === "published" && (
          <form action={retAct} className="ax-row" style={{ alignItems: "flex-end" }}>
            <input type="hidden" name="visit_id" value={visitId} />
            <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label">Return reason *</label>
              <input className="ax-input" name="reason" placeholder="mandatory — STM-VIS-001" /></div>
            <button className="ax-btn ax-btn--secondary" disabled={busy}>Return</button>
          </form>
        )}
        {status === "returned" && (
          <form action={repAct}><input type="hidden" name="visit_id" value={visitId} />
            <button className="ax-btn ax-btn--secondary" disabled={busy}>Republish (same ID)</button></form>
        )}
        {["published", "returned"].includes(status) && (
          <>
            <form action={reaAct} className="ax-row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label">Reassign to</label>
                <select className="ax-select" name="inspector_id"><option value="">—</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
              <button className="ax-btn ax-btn--secondary" disabled={busy}>Reassign</button>
            </form>
            <form action={canAct} className="ax-row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label">Cancellation reason *</label>
                <input className="ax-input" name="reason" placeholder="final — M02-010" /></div>
              <button className="ax-btn ax-btn--danger" disabled={busy}>Cancel visit</button>
            </form>
          </>
        )}
        {["cancelled", "expired"].includes(status) && <span className="ax-lozenge">final state — view only (M02-015/016)</span>}
      </div>
      {msg && <div className="ax-banner ax-banner--critical"><div>{msg}</div></div>}
      {ok && <div className="ax-banner ax-banner--success"><div>{ok}</div></div>}
    </div>
  );
}
