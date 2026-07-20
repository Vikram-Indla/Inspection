"use client";
// SB05 / CD-027 — management actions organised into three explicit zones:
//   • available now       — valid transitions from the current state
//   • disabled, with why  — real actions blocked by a guard (reason shown)
//   • unavailable         — actions that do not apply in this lifecycle state
// Every form binding + server action is PRESERVED; only the presentation and the
// disabled-with-why explanations are added. Guards are mirrored server-side and
// are the authority — these props derive from the same conditions.
import { useActionState } from "react";
import { returnVisit, republishVisit, cancelVisit, rescheduleVisit, reassignVisit, updateVisitType, type ActionResult } from "./actions";

type I = { user_id: string; full_name: string };

// SB19 — strings built server-side with t() and passed as props.
export type ActionBarStrings = {
  heading: string; returnReason: string; returnPlaceholder: string; returnBtn: string;
  republishBtn: string; reassignTo: string; reassignBtn: string;
  newWindowStart: string; newWindowEnd: string; rescheduleBtn: string;
  cancelReason: string; cancelPlaceholder: string; cancelBtn: string;
  visitTypeLabel: string; visitTypeBtn: string;
  typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  executionStarted: string; finalState: string;
  zoneAvailable: string; zoneBlocked: string; zoneUnavailable: string;
  reassignLockedWhy: string; scheduleLockedWhy: string; noneAvailable: string;
};

export default function ActionBar({ visitId, status, opState, opStateLabel, visitType, windowStart, windowEnd, inspectors, canManage, canReassign, isFinal, strings }: {
  visitId: string; status: string; opState: string; opStateLabel: string; visitType: string; windowStart: string; windowEnd: string; inspectors: I[];
  canManage: boolean; canReassign: boolean; isFinal: boolean; strings: ActionBarStrings;
}) {
  const [ret, retAct, p1] = useActionState<ActionResult, FormData>(returnVisit, {});
  const [rep, repAct, p2] = useActionState<ActionResult, FormData>(republishVisit, {});
  const [can, canAct, p3] = useActionState<ActionResult, FormData>(cancelVisit, {});
  const [rsc, rscAct, p4] = useActionState<ActionResult, FormData>(rescheduleVisit, {});
  const [rea, reaAct, p5] = useActionState<ActionResult, FormData>(reassignVisit, {});
  const [vt, vtAct, p6] = useActionState<ActionResult, FormData>(updateVisitType, {});
  const msg = ret.error ?? rep.error ?? can.error ?? rsc.error ?? rea.error ?? vt.error;
  const ok = ret.ok ?? rep.ok ?? can.ok ?? rsc.ok ?? rea.ok ?? vt.ok;
  const busy = p1 || p2 || p3 || p4 || p5 || p6;
  const toLocal = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

  // execution started but still published → schedule/type/cancel are guard-blocked
  const scheduleBlocked = status === "published" && opState !== "new";
  const reassignBlocked = ["published", "returned"].includes(status) && !canReassign;
  const hasAvailable = status === "published" || status === "returned";

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>

      {/* ── ZONE: AVAILABLE NOW ────────────────────────────────── */}
      <div className="ax-actionzone">
        <p className="ax-actionzone__label ax-caption">{strings.zoneAvailable}</p>
        <div className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
          {status === "published" && (
            <form action={retAct} className="row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="visit-return-reason">{strings.returnReason}</label>
                <input className="ax-input" name="reason" id="visit-return-reason" placeholder={strings.returnPlaceholder} /></div>
              <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.returnBtn}</button>
            </form>
          )}
          {status === "returned" && (
            <form action={repAct}><input type="hidden" name="visit_id" value={visitId} />
              <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.republishBtn}</button></form>
          )}
          {canReassign && (
            <form action={reaAct} className="row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="visit-reassign-inspector">{strings.reassignTo}</label>
                <select className="ax-select" name="inspector_id" id="visit-reassign-inspector"><option value="">—</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
              <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.reassignBtn}</button>
            </form>
          )}
          {canManage && (
            <>
              <form action={vtAct} className="row" style={{ alignItems: "flex-end" }}>
                <input type="hidden" name="visit_id" value={visitId} />
                <div className="ax-field" style={{ maxInlineSize: 200 }}><label className="ax-field__label" htmlFor="visit-type-select">{strings.visitTypeLabel}</label>
                  <select className="ax-select" name="visit_type" id="visit-type-select" defaultValue={visitType}>
                    <option value="periodic">{strings.typePeriodic}</option>
                    <option value="follow_up">{strings.typeFollowUp}</option>
                    <option value="complaint">{strings.typeComplaint}</option>
                  </select></div>
                <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.visitTypeBtn}</button>
              </form>
              <form action={rscAct} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                <input type="hidden" name="visit_id" value={visitId} />
                <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="visit-reschedule-start">{strings.newWindowStart}</label>
                  <input className="ax-input ax-numeric" type="datetime-local" name="window_start" id="visit-reschedule-start" defaultValue={toLocal(windowStart)} /></div>
                <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="visit-reschedule-end">{strings.newWindowEnd}</label>
                  <input className="ax-input ax-numeric" type="datetime-local" name="window_end" id="visit-reschedule-end" defaultValue={toLocal(windowEnd)} /></div>
                <button className="ax-btn ax-btn--secondary" disabled={busy}>{strings.rescheduleBtn}</button>
              </form>
              <form action={canAct} className="row" style={{ alignItems: "flex-end" }}>
                <input type="hidden" name="visit_id" value={visitId} />
                <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="visit-cancel-reason">{strings.cancelReason}</label>
                  <input className="ax-input" name="reason" id="visit-cancel-reason" placeholder={strings.cancelPlaceholder} /></div>
                <button className="ax-btn ax-btn--danger" disabled={busy}>{strings.cancelBtn}</button>
              </form>
            </>
          )}
          {!hasAvailable && <p className="ax-caption">{strings.noneAvailable}</p>}
        </div>
      </div>

      {/* ── ZONE: DISABLED, WITH WHY ───────────────────────────── */}
      {(scheduleBlocked || reassignBlocked) && (
        <div className="ax-actionzone">
          <p className="ax-actionzone__label ax-caption">{strings.zoneBlocked}</p>
          <ul className="stack" style={{ gap: "var(--ax-space-100)", margin: 0, paddingInlineStart: 0, listStyle: "none" }}>
            {scheduleBlocked && (
              <li><span className="ax-lozenge ax-lozenge--warning">{strings.cancelBtn} · {strings.rescheduleBtn} · {strings.visitTypeBtn}</span>{" "}
                <span className="ax-caption">{strings.scheduleLockedWhy.replace("{state}", opStateLabel)}</span></li>
            )}
            {reassignBlocked && (
              <li><span className="ax-lozenge ax-lozenge--warning">{strings.reassignBtn}</span>{" "}
                <span className="ax-caption">{strings.reassignLockedWhy.replace("{state}", opStateLabel)}</span></li>
            )}
          </ul>
        </div>
      )}

      {/* ── ZONE: UNAVAILABLE (final lifecycle state) ──────────── */}
      {isFinal && (
        <div className="ax-actionzone">
          <p className="ax-actionzone__label ax-caption">{strings.zoneUnavailable}</p>
          <span className="ax-lozenge">{strings.finalState}</span>
        </div>
      )}

      {/* role=status success / single role=alert failure (DSG-A11Y-001) */}
      <div aria-live="polite">{ok && <div className="ax-banner ax-banner--success" role="status"><div>{ok}</div></div>}</div>
      {msg && <div className="ax-banner ax-banner--critical" role="alert"><div>{msg}</div></div>}
    </div>
  );
}
