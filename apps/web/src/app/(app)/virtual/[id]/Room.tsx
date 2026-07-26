"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import {
  beginRemote, closeSession, joinParticipant, markSessionVerified,
  openWaitingRoom, rescheduleSession, type RoomActionResult,
} from "./actions";
import RoomStage, { type RoomStageStrings } from "./RoomStage";

type P = { id: string; display_name: string; role: string; joined_at: string | null; verified_at: string | null };
type Visit = {
  factories: { name: string; factory_code: string | null; cr_number: string | null } | null;
  package_versions: { id: string; version_label: string; packages: { code: string } | null } | null;
  inspections: { id: string; status: string } | null;
};
type S = { id: string; state: string; appointment_at: string; visit_id: string; visits: Visit | null; virtual_participants: P[] };
type OtpStatus = {
  status: string; verified?: boolean; locked?: boolean; has_active_code?: boolean;
  attempts_used?: number; attempts_max?: number; resends_used?: number; resends_max?: number; expires_at?: string | null;
};

// CD-041 / SCR-VIR-700 (r1) — Appointment Readiness Contract: an ordered evidence
// chain (identity -> time -> participants -> state -> transition -> fallback)
// resolving to exactly one gated next action. Strings built server-side with t().
export type RoomStrings = {
  roles: Record<string, string>;
  verified: string; joinedAwaiting: string; notJoined: string;
  markJoined: string;
  sendOtp: string; resendOtp: string; devCode: string; codeLabel: string; verify: string;
  otpSent: string; otpCooldown: string; otpVerified: string; otpWrong: string; otpLocked: string; otpExpired: string; otpExhausted: string; otpNoCode: string;
  otpError: string;
  otpCounters: string;
  beginReady: string; beginGated: string;
  openWaiting: string;
  rescheduleTitle: string; rescheduleLabel: string; rescheduleSubmit: string;
  closeTitle: string; closeReason: string; closeComments: string; closeSubmit: string; closeWorking: string;
  working: string;
  // readiness contract
  contract: string; contractHint: string;
  apptLink: string; timeLink: string; partLink: string; stateLink: string; transLink: string; fbLink: string;
  ready: string; missing: string; blocked: string; pendingWord: string; scopeOk: string;
  factory: string; sessionWord: string; visitWord: string; pkg: string; inspectionWord: string; inspNone: string;
  apptStored: string; apptTz: string; tzBlocked: string;
  early: string; onwindow: string; late: string; lateDerived: string; relEarly: string; relLate: string;
  partHint: string; you: string;
  inspectorRole: string; repRole: string; awaiting: string;
  statePath: string; statePathHint: string;
  s_scheduled: string; s_waiting: string; s_joined: string; s_verified: string; s_inprogress: string; s_closed: string;
  now: string; done: string; next: string; nowLabel: string;
  transition: string; transHint: string;
  actOpenSub: string; actJoinSub: string;
  actBegin: string; actBeginSub: string; actContinue: string; actContinueSub: string;
  actReschedule: string; actRescheduleSub: string; actClose: string; actCloseSub: string;
  needVerify: string; guardClosed: string; guardLate: string; reschedNo: string;
  reasonLabel: string; reasonPh: string; reasonReq: string;
  fallback: string; fallbackBody: string; fallbackTag: string; fallbackResched: string;
  degraded: string; degradedBody: string;
  emptyPart: string;
  // CD-043 / SCR-VIR-720 — closed/immutable (S12), offline (S15), stale (S13)
  closedTitle: string; closedBody: string; closedHandoff: string;
  offlineTitle: string; offlineBody: string;
  staleTitle: string; staleBody: string; reload: string;
  // WA-DES-044 — the timeline moved into the side column, so its headings come
  // in with the rest of the room strings rather than living on the page.
  timelineHeading: string; timelineEmpty: string;
  /** Heading of the left identity panel. Distinct from partLink, which names the
   *  contract row on the right — two panels titled "Participants" read as a
   *  duplicate rather than as the design's identity step. */
  identityHeading: string;
};

/** One rendered timeline row. Dates are formatted server-side so the client
 *  never reformats them in a different locale (a hydration-mismatch source). */
export type RoomTimelineRow = { at: string; label: string; detail: string };

const fmt = (s: string, vars: Record<string, string | number>) => { return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m) as string); };

const ORDER = ["scheduled", "waiting", "joined", "verified", "in_progress", "closed"];

export default function Room({ session, strings: t, rev, stage, transportConfigured, timeline }: {
  session: S; strings: RoomStrings; rev: string;
  stage: RoomStageStrings;
  /** Server truth from videoTransportStatus() — the client never infers it. */
  transportConfigured: boolean;
  /** Newest-first, pre-formatted server-side. */
  timeline: RoomTimelineRow[];
}) {
  const [parts] = useState(session.virtual_participants);
  const [otpInfo, setOtpInfo] = useState({} as Record<string, { dev_code?: string; msg: string }>);
  const [otpStatus, setOtpStatus] = useState({} as Record<string, OtpStatus>);
  const [verifiedIds, setVerifiedIds] = useState(() => new Set(parts.filter(p => { return !!p.verified_at; }).map(p => { return p.id; })));
  const [codes, setCodes] = useState({} as Record<string, string>);
  const [busy, setBusy] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState({} as RoomActionResult);
  const sb = supabaseBrowser();
  const router = useRouter();

  const [joinState, joinAction, joinPending] = useActionState<RoomActionResult, FormData>(joinParticipant, {});
  const [waitState, waitAction, waitPending] = useActionState<RoomActionResult, FormData>(openWaitingRoom, {});
  const [reschedState, reschedAction, reschedPending] = useActionState<RoomActionResult, FormData>(rescheduleSession, {});
  const [closeState, closeAction, closePending] = useActionState<RoomActionResult, FormData>(closeSession, {});
  const [beginState, beginAction, beginPending] = useActionState<RoomActionResult, FormData>(beginRemote, {});

  // S15 — offline is a UI truth only: nothing is queued and no reconnection is
  // promised; mutating actions are disabled until the browser is back online.
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  // S13 — a server rev-mismatch (concurrent change) surfaces a reload prompt;
  // the guard already refused the write, so nothing was submitted.
  const isStale = [beginState, closeState, reschedState].some(s => { return s?.stale; });

  async function refreshStatus(pid: string) {
    const { data } = await sb.rpc("vp_otp_status", { p_participant: pid });
    if (data) setOtpStatus(s => ({ ...s, [pid]: data as OtpStatus }));
  }
  useEffect(() => {
    parts.filter(p => { return !p.verified_at; }).forEach(p => { refreshStatus(p.id); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestOtp(p: P) {
    setBusy(true);
    const { data, error } = await sb.rpc("vp_request_otp", { p_participant: p.id });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[virtual otp request]", error);
      setOtpInfo(o => ({ ...o, [p.id]: { msg: t.otpError } }));
      setBusy(false);
      return;
    }
    const d = data as { status: string; dev_code?: string; retry_after_s?: number; resends_left?: number };
    setOtpInfo(o => ({
      ...o, [p.id]: {
        dev_code: d.dev_code,
        msg: d.status === "sent" ? fmt(t.otpSent, { n: d.resends_left ?? 0 })
          : d.status === "cooldown" ? fmt(t.otpCooldown, { s: d.retry_after_s ?? 0 })
          : d.status === "exhausted" ? t.otpExhausted : d.status,
      },
    }));
    await refreshStatus(p.id);
    setBusy(false);
  }

  async function verify(p: P) {
    setBusy(true);
    const { data, error } = await sb.rpc("vp_verify_otp", { p_participant: p.id, p_code: codes[p.id] ?? "" });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[virtual otp verify]", error);
      setOtpInfo(o => ({ ...o, [p.id]: { msg: t.otpError } }));
      setBusy(false);
      return;
    }
    const d = data as { status: string; attempts_left?: number };
    if (d.status === "verified") {
      setVerifiedIds(v => new Set([...v, p.id]));
      setOtpInfo(o => ({ ...o, [p.id]: { msg: t.otpVerified } }));
      const fd = new FormData();
      fd.set("session_id", session.id); fd.set("participant_id", p.id);
      // WA-03: surface the session-advance result (previously dropped); WA-04:
      // re-read server truth so the begin gate reflects the real session state
      // rather than the optimistic client set.
      const res = await markSessionVerified({}, fd);
      setVerifyMsg(res);
      if (res.ok) router.refresh();
    } else {
      const msg = d.status === "wrong" ? fmt(t.otpWrong, { n: d.attempts_left ?? 0 })
        : d.status === "locked" ? t.otpLocked
        : d.status === "expired" ? t.otpExpired
        : d.status === "no_code" ? t.otpNoCode : d.status;
      setOtpInfo(o => ({ ...o, [p.id]: { ...o[p.id], msg } }));
    }
    await refreshStatus(p.id);
    setBusy(false);
  }

  const reps = parts.filter(p => { return p.role === "factory_rep"; });
  // The remote tile names the representative the room is waiting on — a real
  // participant row, never a placeholder person.
  const stageRemoteName = reps[0]?.display_name ?? t.repRole;
  const stageRemoteInitials = (stageRemoteName.trim().split(/\s+/)
    .map(w => { return w[0] ?? ""; }).join("").slice(0, 2) || "—").toUpperCase();
  // Client-optimistic aggregate — drives the informational participant link only.
  const allVerified = reps.length > 0 && reps.every(p => { return verifiedIds.has(p.id); });
  // WA-04: the begin transition gate is server-authoritative — a session is only
  // begin-ready once the server has actually advanced it to verified/in_progress.
  const serverReady = session.state === "verified" || session.state === "in_progress";
  const open = session.state !== "closed";
  // Stale rev-mismatch gets its own reload banner (below) — keep it out of the
  // generic critical list so it is not shown twice.
  const errors = [joinState, waitState, reschedState, closeState, beginState, verifyMsg]
    .filter(s => { return s?.error && !s?.stale; }).map(s => { return s.error; });
  const oks = [joinState.ok, waitState.ok, reschedState.ok, closeState.ok, verifyMsg.ok].filter(Boolean);

  // Derived (client-clock) lateness — no server guard exists for this (RUNTIME_TRUTH_LEDGER row 11);
  // the stored appointment_at above is authoritative, this is only a relative hint.
  const late = session.state === "scheduled" && new Date(session.appointment_at).getTime() < Date.now();

  // Single gated next transition — mirrors the real guard in actions.ts/vs_mark_session_verified,
  // not an invented state machine. Per-participant join/OTP stay inline on the participant rows.
  type Trans = { key: string; label: string; sub?: string; blocked?: boolean; why?: string; action: typeof beginAction; pending: boolean };
  const next: Trans = session.state === "closed"
    ? { key: "none", label: t.actClose, blocked: true, why: t.guardClosed, action: beginAction, pending: false }
    : session.state === "scheduled" && !parts.some(p => { return p.joined_at; })
      ? { key: "open", label: t.openWaiting, sub: t.actOpenSub, action: waitAction, pending: waitPending }
      : session.state === "in_progress"
        ? { key: "continue", label: t.actContinue, sub: t.actContinueSub, action: beginAction, pending: beginPending }
        : serverReady
          ? { key: "begin", label: t.beginReady, sub: t.actBeginSub, action: beginAction, pending: beginPending }
          : { key: "begin", label: t.beginGated, blocked: true, why: t.needVerify, action: beginAction, pending: beginPending };

  const stLabel: Record<string, string> = {
    scheduled: t.s_scheduled, waiting: t.s_waiting, joined: t.s_joined, verified: t.s_verified, in_progress: t.s_inprogress, closed: t.s_closed,
  };
  const canReschedule = ["scheduled", "waiting"].includes(session.state);
  const v = session.visits;
  const degraded = !v?.factories || !v?.package_versions;

  // WA-DES-044 — the five contract rows. Every value is a stored session fact;
  // nothing is derived that the server does not already hold, and an absent
  // fact renders as an em dash rather than an assumption.
  const partState = allVerified ? "ready" : reps.some(p => { return p.joined_at; }) ? "pending" : "missing";
  const gates = [
    {
      key: "scope", label: t.apptLink, exc: "exc-compliant", badge: "badge-compliant", state: t.ready,
      detail: [
        `${v?.factories?.name ?? "—"}${v?.factories?.factory_code ? ` ${v.factories.factory_code}` : ""}`,
        `${t.visitWord} ${session.visit_id.slice(0, 8)}`,
        `${t.pkg} ${v?.package_versions?.packages?.code ?? "—"} ${v?.package_versions?.version_label ?? "—"}`,
        `${t.inspectionWord} ${v?.inspections ? `${v.inspections.id.slice(0, 8)} (${v.inspections.status})` : t.inspNone}`,
      ].join(" · "),
    },
    {
      key: "time", label: t.timeLink,
      exc: late ? "exc-critical" : session.state === "scheduled" ? "exc-pending" : "exc-compliant",
      badge: late ? "badge-critical" : session.state === "scheduled" ? "badge-pending" : "badge-compliant",
      state: late ? t.blocked : session.state === "scheduled" ? t.pendingWord : t.ready,
      detail: `${session.appointment_at} · ${late ? t.late : session.state === "scheduled" ? t.early : t.onwindow} · ${t.tzBlocked}`,
    },
    {
      key: "participants", label: t.partLink,
      exc: partState === "ready" ? "exc-compliant" : partState === "pending" ? "exc-warning" : "exc-critical",
      badge: partState === "ready" ? "badge-compliant" : partState === "pending" ? "badge-warning" : "badge-critical",
      state: partState === "ready" ? t.ready : partState === "pending" ? t.pendingWord : t.missing,
      detail: parts.length === 0 ? t.emptyPart : parts.map(p => {
        return `${p.display_name} — ${verifiedIds.has(p.id) ? t.verified : p.joined_at ? t.awaiting : t.notJoined}`;
      }).join(" · "),
    },
    {
      key: "state", label: t.stateLink,
      exc: session.state === "closed" ? "exc-critical" : "exc-compliant",
      badge: session.state === "closed" ? "badge-critical" : "badge-compliant",
      state: session.state === "closed" ? t.blocked : t.ready,
      detail: `${stLabel[session.state] ?? session.state} · ${t.statePathHint}`,
    },
    {
      key: "fallback", label: t.fbLink, exc: "exc-pending", badge: "badge-pending", state: t.pendingWord,
      detail: `${t.fallbackBody} ${t.fallbackResched}`,
    },
  ];

  return (
    <div className="cd-vir">
      {/* S12 — closed session is immutable and read-only; the reason is preserved
          and continuation is a hand-off to the shared engine (submission → P08). */}
      {!open && (
        <div className="sq-banner sq-banner--immutable" role="status">
          <div><strong>{t.closedTitle}</strong> — {t.closedBody} <span className="cd-sub">{t.closedHandoff}</span></div>
        </div>
      )}
      {/* S15 — offline: mutating actions disabled; nothing queued. */}
      {offline && (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div><strong>{t.offlineTitle}</strong> — {t.offlineBody}</div>
        </div>
      )}
      {/* S13 — stale: a concurrent change was detected; reload the true state. */}
      {isStale && (
        <div className="sq-banner sq-banner--warning" role="alert">
          <div><strong>{t.staleTitle}</strong> — {t.staleBody}</div>
          <button className="btn btn-secondary btn-touch" onClick={() => { router.refresh(); }}>{t.reload}</button>
        </div>
      )}
      {errors.map((e, i) => <div key={i} className="sq-banner sq-banner--critical" role="alert"><div>{e}</div></div>)}
      {oks.map((m, i) => <div key={i} className="sq-banner sq-banner--success"><div>{m}</div></div>)}
      {degraded && (
        <div className="sq-banner sq-banner--warning"><div><strong>{t.degraded}</strong> — {t.degradedBody}</div></div>
      )}

      {/* decision bar — current state + the one allowed next transition */}
      <section className={`cd-decisionbar ${next.blocked ? "is-blocked" : "is-ready"}`} aria-label={t.transition}>
        <div className="cd-decisionbar__l">
          <span className="cd-sub">{t.nowLabel}: <span className="sq-lozenge sq-lozenge--virtual">{stLabel[session.state] ?? session.state}</span></span>
          <strong className="cd-decisionbar__act">{t.next}: {next.label}</strong>
          {next.blocked ? <span className="cd-sub cd-warn">{next.why}</span> : <span className="cd-sub">{t.transHint}</span>}
        </div>
        <div>
          {next.key !== "none" && (
            <a className="btn btn-primary btn-lg btn-touch" href="#vir-actionzone" role="button">{next.label}</a>
          )}
        </div>
      </section>

      <div className="cd-grid">
        <div className="cd-grid__main">
          {/* WA-DES-044 — the room leads the column: device checks and screen
              share are usable before anyone joins, and the remote leg states
              its own availability. */}
          <RoomStage strings={stage} remoteName={stageRemoteName}
            remoteInitials={stageRemoteInitials} transportConfigured={transportConfigured} />

          {/* WA-DES-044 — identity verification is the human work of the room:
              who is present, who is proven, and the one code entry that gates
              execution. The readiness contract moved to the side column, so the
              per-participant controls live here beside the people they act on
              instead of being split across two columns. */}
          <section className="panel cd-contract" aria-label={t.identityHeading}>
            <div className="cd-sectionhead"><h3>{t.identityHeading}</h3></div>
            <p className="cd-sub">{t.partHint}</p>
            {parts.length === 0 && <p className="cd-sub">{t.emptyPart}</p>}
            {parts.map(p => {
              const isVerified = verifiedIds.has(p.id);
              const st = otpStatus[p.id];
              const initials = (p.display_name.trim().split(/\s+/)
                .map(w => { return w[0] ?? ""; }).join("").slice(0, 2) || "—").toUpperCase();
              return (
                <div className="cd-idrow" key={p.id}>
                  <span className="avatar" aria-hidden="true">{initials}</span>
                  <div className="cd-idrow__b">
                    <div><strong>{p.display_name}</strong>{" "}
                      <span className="cd-sub">{t.roles[p.role] ?? p.role.replace(/_/g, " ")}</span></div>
                    {open && !p.joined_at && (
                      <form action={joinAction} className="row" style={{ marginBlockStart: 6 }}>
                        <input type="hidden" name="session_id" value={session.id} />
                        <input type="hidden" name="participant_id" value={p.id} />
                        <button className="btn btn-secondary btn-touch" disabled={joinPending}>{joinPending ? t.working : t.markJoined}</button>
                      </form>
                    )}
                    {open && !isVerified && p.role === "factory_rep" && (
                      <div className="cd-otp">
                        <div className="row" style={{ alignItems: "flex-end", marginBlockStart: 6 }}>
                          <button className="btn btn-secondary btn-touch" onClick={() => requestOtp(p)} disabled={busy || !!st?.locked}>
                            {st?.has_active_code || (st?.resends_used ?? 0) > 0 ? t.resendOtp : t.sendOtp}
                          </button>
                          {otpInfo[p.id]?.dev_code && <span className="badge badge-warning">{t.devCode} {otpInfo[p.id].dev_code}</span>}
                          <div className="sq-field cd-otpfield" style={{ maxInlineSize: 160 }}><label className="sq-field__label" htmlFor={`virtual-otp-code-${p.id}`}>{t.codeLabel}</label>
                            <input className="sq-input numeric" id={`virtual-otp-code-${p.id}`} value={codes[p.id] ?? ""} onChange={e => setCodes(c => ({ ...c, [p.id]: e.target.value }))} maxLength={6} /></div>
                          <button className="btn btn-primary btn-touch" onClick={() => verify(p)} disabled={busy || !!st?.locked}>{t.verify}</button>
                        </div>
                        {st?.status === "ok" && (
                          <p className="cd-sub cd-mono">
                            {fmt(t.otpCounters, { a: st.attempts_used ?? 0, b: st.attempts_max ?? 0, c: st.resends_used ?? 0, d: st.resends_max ?? 0 })}
                            {st.locked && <> · <span className="badge badge-critical">{t.otpLocked}</span></>}
                          </p>
                        )}
                      </div>
                    )}
                    {otpInfo[p.id]?.msg && <p className="cd-sub">{otpInfo[p.id].msg}</p>}
                  </div>
                  <div className="cd-idrow__st">
                    {isVerified
                      ? <span className="badge badge-compliant">{t.verified}</span>
                      : p.joined_at
                        ? <span className="badge badge-warning">{t.awaiting}</span>
                        : <span className="badge">{t.notJoined}</span>}
                  </div>
                </div>
              );
            })}
          </section>

          {/* action zone — gated primary + reschedule + close-with-reason */}
          <section className="panel cd-action" id="vir-actionzone" tabIndex={-1} aria-label={t.transition}>
            <div className="cd-sectionhead"><h3>{t.transition}</h3></div>
            <p className="cd-sub">{t.transHint}</p>
            {next.key !== "none" && (
              <form action={next.action} className={`cd-primaryzone ${next.blocked ? "is-blocked" : "is-ready"}`}>
                <input type="hidden" name="session_id" value={session.id} />
                <input type="hidden" name="rev" value={rev} />
                <button className="btn btn-primary btn-field cd-primary" disabled={next.blocked || next.pending || offline}>
                  {next.pending ? t.working : next.label}
                </button>
                {next.blocked ? <p className="cd-sub cd-warn" role="status">{next.why}</p> : <p className="cd-sub">{next.sub}</p>}
              </form>
            )}
            {open && (
              <div className="cd-secacts">
                {canReschedule ? (
                  <form action={reschedAction} className="cd-secact">
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="rev" value={rev} />
                    <div className="sq-field"><label className="sq-field__label" htmlFor="virtual-reschedule-appt">{t.rescheduleLabel}</label>
                      <input className="sq-input numeric" type="datetime-local" name="appointment_at" id="virtual-reschedule-appt" defaultValue={session.appointment_at.slice(0, 16)} required /></div>
                    <button className="btn btn-secondary btn-touch" disabled={reschedPending || offline}>{reschedPending ? t.working : t.rescheduleSubmit}</button>
                  </form>
                ) : (
                  <div className="cd-secact cd-secact--dis"><button className="btn btn-secondary btn-touch" aria-disabled="true" disabled>{t.actReschedule}</button><span className="cd-sub cd-warn">{t.reschedNo}</span></div>
                )}
              </div>
            )}
            {open && (
              <form action={closeAction} className="cd-closebox sq-field">
                <h4>{t.closeTitle}</h4>
                <input type="hidden" name="session_id" value={session.id} />
                <input type="hidden" name="rev" value={rev} />
                <label className="sq-field__label" htmlFor="virtual-close-reason">{t.closeReason} <span className="sq-req">*</span></label>
                <input className="sq-input" name="reason" id="virtual-close-reason" placeholder={t.reasonPh} required />
                <label className="sq-field__label" htmlFor="virtual-close-comments">{t.closeComments}</label>
                <textarea className="sq-textarea" name="comments" id="virtual-close-comments" rows={2} />
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-danger btn-touch" disabled={closePending || offline}>{closePending ? t.closeWorking : t.closeSubmit}</button>
                </div>
              </form>
            )}
          </section>
        </div>

        <aside className="cd-grid__side">
          {/* WA-DES-044 — the readiness contract, as compact evidence rows.
              Same stored facts as the earlier card grid: the transition is
              promoted to its own action panel on the left and the fallback
              rides the last row, so nothing is dropped by the denser form. */}
          <section className="panel cd-side" aria-label={t.contract}>
            <div className="cd-sectionhead"><h3>{t.contract}</h3></div>
            <p className="cd-sub">{t.contractHint}</p>
            <div className="cd-gates">
              {gates.map(g => (
                <div className="cd-gate" key={g.key}>
                  <span className={`exc ${g.exc} cd-gate__mark`} aria-hidden="true"><span className="exc-mark"></span></span>
                  <div className="cd-gate__b">
                    <div className="cd-gate__label">{g.label}</div>
                    <div className="cd-gate__detail">{g.detail}</div>
                  </div>
                  <span className={`badge ${g.badge}`}>{g.state}</span>
                </div>
              ))}
            </div>
          </section>

          {/* canonical state path — horizontal compact spine */}
          <section className="panel cd-side" aria-label={t.statePath}>
            <div className="cd-sectionhead"><h3>{t.statePath}</h3></div>
            <div className="spine is-horizontal is-compact">
              {ORDER.map((s, i) => {
                const curIdx = ORDER.indexOf(session.state);
                const cls = i < curIdx ? "is-done" : i === curIdx ? "is-current" : "";
                return (
                  <div className={`spine-node ${cls}`} key={s}>
                    <span className="spine-dot" aria-hidden="true">{i < curIdx ? "✓" : i + 1}</span>
                    <span className="spine-label">{stLabel[s]}</span>
                    <span className="sr-only"> — {i < curIdx ? t.done : i === curIdx ? t.now : t.next}</span>
                  </div>
                );
              })}
            </div>
            <p className="cd-sub">{t.statePathHint}</p>
          </section>

          {/* session timeline — append-only, server-authoritative. Rendered on
              the DS timeline component (was loose paragraphs under the page). */}
          <section className="panel cd-side" aria-label={t.timelineHeading}>
            <div className="cd-sectionhead"><h3>{t.timelineHeading}</h3></div>
            {timeline.length === 0 && <p className="cd-sub">{t.timelineEmpty}</p>}
            <ul className="timeline">
              {timeline.map((e, i) => (
                <li key={i}>
                  <span className={`tl-dot ${i === 0 ? "is-accent" : ""}`}></span>
                  <div className="tl-title">{e.label}</div>
                  <div className="tl-meta"><span className="cd-mono">{e.at}</span>{e.detail}</div>
                </li>
              ))}
            </ul>
          </section>

          {/* The participant register moved into the identity panel on the left,
              beside the controls that act on it; the standalone fallback panel is
              now the last contract row. Both facts are preserved, not dropped. */}
        </aside>
      </div>
    </div>
  );
}
