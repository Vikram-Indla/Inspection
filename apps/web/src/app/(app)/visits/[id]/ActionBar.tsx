"use client";
// SB05 / CD-027 — management actions organised into three explicit zones:
//   • available now       — valid transitions from the current state
//   • disabled, with why  — real actions blocked by a guard (reason shown)
//   • unavailable         — actions that do not apply in this lifecycle state
// Every form binding + server action is PRESERVED; only the presentation and the
// disabled-with-why explanations are added. Guards are mirrored server-side and
// are the authority — these props derive from the same conditions.
// M8 / PLN-CON-011 — return/cancel reasons are governed planning_lookups keys
// (never free text); 'other' requires comments (server-enforced, hinted here).
// M8 — returned visits expose re-window / repackage / cancel alongside
// republish/reassign (canonical §15); final visits expose Duplicate → new Draft.
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { returnVisit, republishVisit, cancelVisit, rescheduleVisit, reassignVisit, updateVisitType, duplicateVisit, repackageVisit, type ActionResult } from "./actions";
import type { ReasonOption } from "@/lib/planning/lifecycle";

type I = { user_id: string; full_name: string };
export type PackageOption = { id: string; label: string };

// SB19 — strings built server-side with t() and passed as props.
export type ActionBarStrings = {
  heading: string; returnReason: string; returnComments: string; returnBtn: string;
  republishBtn: string; reassignTo: string; reassignBtn: string;
  newWindowStart: string; newWindowEnd: string; rescheduleBtn: string;
  cancelReason: string; cancelComments: string; cancelBtn: string;
  visitTypeLabel: string; visitTypeBtn: string;
  typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  executionStarted: string; finalState: string;
  zoneAvailable: string; zoneBlocked: string; zoneUnavailable: string;
  reassignLockedWhy: string; scheduleLockedWhy: string; noneAvailable: string;
  // M8
  commentsHint: string; repackageLabel: string; repackageBtn: string;
  duplicateBtn: string; duplicateWhy: string;
};

export default function ActionBar({ visitId, status, opState, opStateLabel, visitType, windowStart, windowEnd, inspectors, canManage, canReassign, isFinal, returnReasons, cancelReasons, packageOptions, strings }: {
  visitId: string; status: string; opState: string; opStateLabel: string; visitType: string; windowStart: string; windowEnd: string; inspectors: I[];
  canManage: boolean; canReassign: boolean; isFinal: boolean;
  returnReasons: ReasonOption[]; cancelReasons: ReasonOption[]; packageOptions: PackageOption[];
  strings: ActionBarStrings;
}) {
  const router = useRouter();
  const [ret, retAct, p1] = useActionState<ActionResult, FormData>(returnVisit, {});
  const [rep, repAct, p2] = useActionState<ActionResult, FormData>(republishVisit, {});
  const [can, canAct, p3] = useActionState<ActionResult, FormData>(cancelVisit, {});
  const [rsc, rscAct, p4] = useActionState<ActionResult, FormData>(rescheduleVisit, {});
  const [rea, reaAct, p5] = useActionState<ActionResult, FormData>(reassignVisit, {});
  const [vt, vtAct, p6] = useActionState<ActionResult, FormData>(updateVisitType, {});
  const [dup, dupAct, p7] = useActionState<ActionResult, FormData>(duplicateVisit, {});
  const [pkg, pkgAct, p8] = useActionState<ActionResult, FormData>(repackageVisit, {});
  const msg = ret.error ?? rep.error ?? can.error ?? rsc.error ?? rea.error ?? vt.error ?? dup.error ?? pkg.error;
  const ok = ret.ok ?? rep.ok ?? can.ok ?? rsc.ok ?? rea.ok ?? vt.ok ?? dup.ok ?? pkg.ok;
  const busy = p1 || p2 || p3 || p4 || p5 || p6 || p7 || p8;
  const toLocal = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

  // M8 — a successful duplicate routes to the draft continuation of its
  // method: single → single wizard resume; bulk → bulk review resume.
  useEffect(() => {
    if (dup.planId && !dup.error) {
      router.push(dup.method === "bulk" ? `/planning/bulk/review?plan=${dup.planId}` : `/planning/single?plan=${dup.planId}`);
    }
  }, [dup.planId, dup.error, dup.method, router]);

  // execution started but still published → schedule/type/cancel are guard-blocked
  const scheduleBlocked = status === "published" && opState !== "new";
  const reassignBlocked = ["published", "returned"].includes(status) && !canReassign;
  // M8 — returned+new: republish/reassign plus re-window, repackage, cancel (§15).
  const canManageReturned = status === "returned" && opState === "new";
  const hasAvailable = status === "published" || status === "returned" || isFinal;

  return (
    <div className="panel" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <h4 style={{ margin: 0 }}>{strings.heading}</h4>

      {/* ── ZONE: AVAILABLE NOW ────────────────────────────────── */}
      <div className="ax-actionzone">
        <p className="ax-actionzone__label t-caption">{strings.zoneAvailable}</p>
        <div className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: "var(--space-4)" }}>
          {status === "published" && (
            <form action={retAct} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="visit-return-reason">{strings.returnReason}</label>
                <select className="ax-select" name="reason_key" id="visit-return-reason" required>
                  <option value="">—</option>
                  {returnReasons.map(o => <option key={o.key} value={o.key}>{o.label_en}</option>)}
                </select></div>
              <div className="ax-field" style={{ maxInlineSize: 260 }}><label className="ax-field__label" htmlFor="visit-return-comments">{strings.returnComments}</label>
                <input className="ax-input" name="comments" id="visit-return-comments" placeholder={strings.commentsHint} /></div>
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.returnBtn}</button>
            </form>
          )}
          {status === "returned" && (
            <form action={repAct}><input type="hidden" name="visit_id" value={visitId} />
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.republishBtn}</button></form>
          )}
          {canReassign && (
            <form action={reaAct} className="row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="visit-reassign-inspector">{strings.reassignTo}</label>
                <select className="ax-select" name="inspector_id" id="visit-reassign-inspector"><option value="">—</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.reassignBtn}</button>
            </form>
          )}
          {canManage && (
            <form action={vtAct} className="row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 200 }}><label className="ax-field__label" htmlFor="visit-type-select">{strings.visitTypeLabel}</label>
                <select className="ax-select" name="visit_type" id="visit-type-select" defaultValue={visitType}>
                  <option value="periodic">{strings.typePeriodic}</option>
                  <option value="follow_up">{strings.typeFollowUp}</option>
                  <option value="complaint">{strings.typeComplaint}</option>
                </select></div>
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.visitTypeBtn}</button>
            </form>
          )}
          {(canManage || canManageReturned) && (
            <>
              <form action={rscAct} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                <input type="hidden" name="visit_id" value={visitId} />
                <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="visit-reschedule-start">{strings.newWindowStart}</label>
                  <input className="ax-input numeric" type="datetime-local" name="window_start" id="visit-reschedule-start" defaultValue={toLocal(windowStart)} /></div>
                <div className="ax-field" style={{ maxInlineSize: 220 }}><label className="ax-field__label" htmlFor="visit-reschedule-end">{strings.newWindowEnd}</label>
                  <input className="ax-input numeric" type="datetime-local" name="window_end" id="visit-reschedule-end" defaultValue={toLocal(windowEnd)} /></div>
                <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.rescheduleBtn}</button>
              </form>
              <form action={canAct} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                <input type="hidden" name="visit_id" value={visitId} />
                <div className="ax-field" style={{ maxInlineSize: 240 }}><label className="ax-field__label" htmlFor="visit-cancel-reason">{strings.cancelReason}</label>
                  <select className="ax-select" name="reason_key" id="visit-cancel-reason" required>
                    <option value="">—</option>
                    {cancelReasons.map(o => <option key={o.key} value={o.key}>{o.label_en}</option>)}
                  </select></div>
                <div className="ax-field" style={{ maxInlineSize: 260 }}><label className="ax-field__label" htmlFor="visit-cancel-comments">{strings.cancelComments}</label>
                  <input className="ax-input" name="comments" id="visit-cancel-comments" placeholder={strings.commentsHint} /></div>
                <button className="btn btn-danger btn-touch" disabled={busy}>{strings.cancelBtn}</button>
              </form>
            </>
          )}
          {canManageReturned && packageOptions.length > 0 && (
            <form action={pkgAct} className="row" style={{ alignItems: "flex-end" }}>
              <input type="hidden" name="visit_id" value={visitId} />
              <div className="ax-field" style={{ maxInlineSize: 260 }}><label className="ax-field__label" htmlFor="visit-repackage">{strings.repackageLabel}</label>
                <select className="ax-select" name="package_version_id" id="visit-repackage" required>
                  <option value="">—</option>
                  {packageOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select></div>
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.repackageBtn}</button>
            </form>
          )}
          {/* M8 / PLN-REQ-011 — final visits (cancelled / expired): Duplicate → new Draft */}
          {isFinal && (
            <form action={dupAct}>
              <input type="hidden" name="visit_id" value={visitId} />
              <button className="btn btn-secondary btn-touch" disabled={busy}>{strings.duplicateBtn}</button>
            </form>
          )}
          {!hasAvailable && <p className="t-caption">{strings.noneAvailable}</p>}
        </div>
      </div>

      {/* ── ZONE: DISABLED, WITH WHY ───────────────────────────── */}
      {(scheduleBlocked || reassignBlocked) && (
        <div className="ax-actionzone">
          <p className="ax-actionzone__label t-caption">{strings.zoneBlocked}</p>
          <ul className="stack" style={{ gap: "var(--space-2)", margin: 0, paddingInlineStart: 0, listStyle: "none" }}>
            {scheduleBlocked && (
              <li><span className="badge badge-warning">{strings.cancelBtn} · {strings.rescheduleBtn} · {strings.visitTypeBtn}</span>{" "}
                <span className="t-caption">{strings.scheduleLockedWhy.replace("{state}", opStateLabel)}</span></li>
            )}
            {reassignBlocked && (
              <li><span className="badge badge-warning">{strings.reassignBtn}</span>{" "}
                <span className="t-caption">{strings.reassignLockedWhy.replace("{state}", opStateLabel)}</span></li>
            )}
          </ul>
        </div>
      )}

      {/* ── ZONE: UNAVAILABLE (final lifecycle state) ──────────── */}
      {isFinal && (
        <div className="ax-actionzone">
          <p className="ax-actionzone__label t-caption">{strings.zoneUnavailable}</p>
          <span className="badge">{strings.finalState}</span>{" "}
          <span className="t-caption">{strings.duplicateWhy}</span>
        </div>
      )}

      {/* role=status success / single role=alert failure (DSG-A11Y-001) */}
      <div aria-live="polite">{ok && <div className="ax-banner ax-banner--success" role="status"><div>{ok}</div></div>}</div>
      {msg && <div className="ax-banner ax-banner--critical" role="alert"><div>{msg}</div></div>}
    </div>
  );
}
