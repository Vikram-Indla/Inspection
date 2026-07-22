"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import {
  beginRemote, closeSession, joinParticipant, markSessionVerified,
  openWaitingRoom, rescheduleSession, type RoomActionResult,
} from "./actions";
import { selectVideoProvider, type VideoJoinResult } from "@/lib/providers/video";

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
  adapterTitle: string; adapterBody: string; adapterPending: string; videoPlaceholder: string; simulatedSession: string;
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
  room: string; roomPending: string; roomBody: string; roomTag: string; roomContinue: string;
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
};

const fmt = (s: string, vars: Record<string, string | number>) => { return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m) as string); };

const ORDER = ["scheduled", "waiting", "joined", "verified", "in_progress", "closed"];

export default function Room({ session, strings: t, rev }: { session: S; strings: RoomStrings; rev: string }) {
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

  // Cycle 2 Wave 2.A — opt-in only (NEXT_PUBLIC_FEATURE_VIDEO_PROVIDER=stub);
  // additive to the existing honest "provider adapter pending" box, never
  // replacing it unless a stub is explicitly selected. Never claims a real
  // connection — always rendered as SIMULATED.
  const [simVideo, setSimVideo] = useState<VideoJoinResult | null>(null);
  useEffect(() => {
    if (session.state !== "in_progress") { setSimVideo(null); return; }
    const provider = selectVideoProvider();
    if (!provider) return;
    let cancelled = false;
    provider.joinRoom(session.id, "self").then(r => { if (!cancelled) setSimVideo(r); });
    return () => { cancelled = true; };
  }, [session.state, session.id]);

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

  return (
    <div className="cd-vir">
      {/* S12 — closed session is immutable and read-only; the reason is preserved
          and continuation is a hand-off to the shared engine (submission → P08). */}
      {!open && (
        <div className="ax-banner ax-banner--immutable" role="status">
          <div><strong>{t.closedTitle}</strong> — {t.closedBody} <span className="cd-sub">{t.closedHandoff}</span></div>
        </div>
      )}
      {/* S15 — offline: mutating actions disabled; nothing queued. */}
      {offline && (
        <div className="ax-banner ax-banner--warning" role="alert">
          <div><strong>{t.offlineTitle}</strong> — {t.offlineBody}</div>
        </div>
      )}
      {/* S13 — stale: a concurrent change was detected; reload the true state. */}
      {isStale && (
        <div className="ax-banner ax-banner--warning" role="alert">
          <div><strong>{t.staleTitle}</strong> — {t.staleBody}</div>
          <button className="btn btn-secondary btn-touch" onClick={() => { router.refresh(); }}>{t.reload}</button>
        </div>
      )}
      {errors.map((e, i) => <div key={i} className="ax-banner ax-banner--critical" role="alert"><div>{e}</div></div>)}
      {oks.map((m, i) => <div key={i} className="ax-banner ax-banner--success"><div>{m}</div></div>)}
      {degraded && (
        <div className="ax-banner ax-banner--warning"><div><strong>{t.degraded}</strong> — {t.degradedBody}</div></div>
      )}

      {/* decision bar — current state + the one allowed next transition */}
      <section className={`cd-decisionbar ${next.blocked ? "is-blocked" : "is-ready"}`} aria-label={t.transition}>
        <div className="cd-decisionbar__l">
          <span className="cd-sub">{t.nowLabel}: <span className="ax-lozenge ax-lozenge--virtual">{stLabel[session.state] ?? session.state}</span></span>
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
          {/* six-link readiness contract */}
          <section className="panel cd-contract" aria-label={t.contract}>
            <div className="cd-sectionhead"><h3>{t.contract}</h3></div>
            <p className="cd-sub">{t.contractHint}</p>
            <ol className="cd-links">
              <li className="cd-link cd-link--ready">
                <span className="cd-link__n" aria-hidden="true">1</span>
                <div className="cd-link__b">
                  <div className="cd-link__head"><h4>{t.apptLink}</h4><span className="cd-linkstate cd-linkstate--ready">{t.ready}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.factory}</span><span>{v?.factories?.name ?? "—"} {v?.factories?.factory_code ? <span className="cd-mono">{v.factories.factory_code}</span> : ""}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.visitWord}</span><span className="cd-mono">{session.visit_id.slice(0, 8)}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.pkg}</span><span className="cd-mono">{v?.package_versions?.packages?.code ?? "—"} · {v?.package_versions?.version_label ?? "—"}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.inspectionWord}</span><span>
                    {v?.inspections ? <><span className="cd-mono">{v.inspections.id.slice(0, 8)}</span> <span className="ax-lozenge ax-lozenge--review">{v.inspections.status}</span></> : <span className="cd-sub">{t.inspNone}</span>}
                  </span></div>
                  <span className="cd-tag cd-tag--ok">{t.scopeOk}</span>
                </div>
              </li>
              <li className={`cd-link ${late ? "cd-link--blocked" : session.state === "scheduled" ? "cd-link--info" : "cd-link--ready"}`}>
                <span className="cd-link__n" aria-hidden="true">2</span>
                <div className="cd-link__b">
                  <div className="cd-link__head"><h4>{t.timeLink}</h4><span className={`cd-linkstate ${late ? "cd-linkstate--blocked" : session.state === "scheduled" ? "cd-linkstate--info" : "cd-linkstate--ready"}`}>{late ? t.blocked : session.state === "scheduled" ? t.pendingWord : t.ready}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.apptStored}</span><span className="cd-mono cd-time">{session.appointment_at}</span></div>
                  <p className="cd-sub">{late ? t.late : session.state === "scheduled" ? t.early : t.onwindow}</p>
                  <p className="cd-sub"><span className="cd-tag cd-tag--blocked">{t.tzBlocked}</span> {t.apptTz}</p>
                  {late && <p className="cd-sub cd-warn">{t.lateDerived}</p>}
                </div>
              </li>
              <li className={`cd-link ${allVerified ? "cd-link--ready" : reps.some(p => { return p.joined_at; }) ? "cd-link--pending" : "cd-link--missing"}`}>
                <span className="cd-link__n" aria-hidden="true">3</span>
                <div className="cd-link__b">
                  <div className="cd-link__head"><h4>{t.partLink}</h4><span className={`cd-linkstate ${allVerified ? "cd-linkstate--ready" : reps.some(p => { return p.joined_at; }) ? "cd-linkstate--pending" : "cd-linkstate--missing"}`}>{allVerified ? t.ready : reps.some(p => { return p.joined_at; }) ? t.pendingWord : t.missing}</span></div>
                  {parts.length === 0 && <p className="cd-sub">{t.emptyPart}</p>}
                  {parts.map(p => (
                    <div className="cd-kv" key={p.id}><span className="cd-kv__k">{t.roles[p.role] ?? p.role}</span><span>{p.display_name} · {verifiedIds.has(p.id) ? <span className="badge badge-compliant">{t.verified}</span> : p.joined_at ? <span className="badge badge-warning">{t.joinedAwaiting}</span> : <span className="badge">{t.notJoined}</span>}</span></div>
                  ))}
                  <p className="cd-sub">{t.partHint}</p>
                </div>
              </li>
              <li className={`cd-link ${session.state === "closed" ? "cd-link--blocked" : "cd-link--ready"}`}>
                <span className="cd-link__n" aria-hidden="true">4</span>
                <div className="cd-link__b">
                  <div className="cd-link__head"><h4>{t.stateLink}</h4><span className={`cd-linkstate ${session.state === "closed" ? "cd-linkstate--blocked" : "cd-linkstate--ready"}`}>{session.state === "closed" ? t.blocked : t.ready}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.nowLabel}</span><span><span className="ax-lozenge ax-lozenge--virtual">{stLabel[session.state] ?? session.state}</span></span></div>
                  <p className="cd-sub">{t.statePathHint}</p>
                </div>
              </li>
              <li className={`cd-link ${next.blocked ? "cd-link--blocked" : "cd-link--ready"}`}>
                <span className="cd-link__n" aria-hidden="true">5</span>
                <div className="cd-link__b">
                  <div className="cd-link__head"><h4>{t.transLink}</h4><span className={`cd-linkstate ${next.blocked ? "cd-linkstate--blocked" : "cd-linkstate--ready"}`}>{next.blocked ? t.blocked : t.ready}</span></div>
                  <div className="cd-kv"><span className="cd-kv__k">{t.next}</span><span><strong>{next.label}</strong></span></div>
                  <p className="cd-sub">{next.blocked ? next.why : next.sub}</p>
                </div>
              </li>
              <li className="cd-link cd-link--pending">
                <span className="cd-link__n" aria-hidden="true">6</span>
                <div className="cd-link__b">
                  <div className="cd-link__head"><h4>{t.fbLink}</h4><span className="cd-linkstate cd-linkstate--pending">{t.pendingWord}</span></div>
                  <p className="cd-sub"><span className="cd-tag cd-tag--blocked">{t.fallbackTag}</span> {t.fallbackBody}</p>
                  <p className="cd-sub">{t.fallbackResched}</p>
                </div>
              </li>
            </ol>
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
                    <div className="ax-field"><label className="ax-field__label" htmlFor="virtual-reschedule-appt">{t.rescheduleLabel}</label>
                      <input className="ax-input numeric" type="datetime-local" name="appointment_at" id="virtual-reschedule-appt" defaultValue={session.appointment_at.slice(0, 16)} required /></div>
                    <button className="btn btn-secondary btn-touch" disabled={reschedPending || offline}>{reschedPending ? t.working : t.rescheduleSubmit}</button>
                  </form>
                ) : (
                  <div className="cd-secact cd-secact--dis"><button className="btn btn-secondary btn-touch" aria-disabled="true" disabled>{t.actReschedule}</button><span className="cd-sub cd-warn">{t.reschedNo}</span></div>
                )}
              </div>
            )}
            {open && (
              <form action={closeAction} className="cd-closebox ax-field">
                <h4>{t.closeTitle}</h4>
                <input type="hidden" name="session_id" value={session.id} />
                <input type="hidden" name="rev" value={rev} />
                <label className="ax-field__label" htmlFor="virtual-close-reason">{t.closeReason} <span className="ax-req">*</span></label>
                <input className="ax-input" name="reason" id="virtual-close-reason" placeholder={t.reasonPh} required />
                <label className="ax-field__label" htmlFor="virtual-close-comments">{t.closeComments}</label>
                <textarea className="ax-textarea" name="comments" id="virtual-close-comments" rows={2} />
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="btn btn-danger btn-touch" disabled={closePending || offline}>{closePending ? t.closeWorking : t.closeSubmit}</button>
                </div>
              </form>
            )}
          </section>
        </div>

        <aside className="cd-grid__side">
          {/* canonical state path */}
          <section className="panel cd-path" aria-label={t.statePath}>
            <div className="cd-sectionhead"><h3>{t.statePath}</h3></div>
            <ol className="cd-nodes">
              {ORDER.map((s, i) => {
                const curIdx = ORDER.indexOf(session.state);
                const cls = i < curIdx ? "is-done" : i === curIdx ? "is-now" : "is-next";
                return (
                  <li className={`cd-node ${cls}`} key={s}>
                    <span className="cd-node__dot" aria-hidden="true"></span>
                    {i < curIdx ? <span className="cd-node__badge" aria-hidden="true">✓</span> : i === curIdx ? <span className="cd-node__badge cd-node__badge--now">{t.now}</span> : <span className="cd-node__badge" aria-hidden="true">{i + 1}</span>}
                    <span className="cd-node__label">{stLabel[s]}</span>
                    <span className="sr-only"> — {i < curIdx ? t.done : i === curIdx ? t.now : t.next}</span>
                  </li>
                );
              })}
            </ol>
            <p className="cd-sub">{t.statePathHint}</p>
          </section>

          {/* participant register */}
          <section className="panel cd-side" aria-label={t.partLink}>
            <div className="cd-sectionhead"><h3>{t.partLink}</h3></div>
            {parts.length === 0 && <p className="cd-sub">{t.emptyPart}</p>}
            <ul className="cd-plist">
              {parts.map(p => {
                const isVerified = verifiedIds.has(p.id);
                const st = otpStatus[p.id];
                return (
                  <li key={p.id} className="cd-prow">
                    <div><strong>{p.display_name}</strong><div className="cd-sub">{t.roles[p.role] ?? p.role.replace(/_/g, " ")}</div>
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
                            <div className="ax-field cd-otpfield" style={{ maxInlineSize: 160 }}><label className="ax-field__label" htmlFor={`virtual-otp-code-${p.id}`}>{t.codeLabel}</label>
                              <input className="ax-input numeric" id={`virtual-otp-code-${p.id}`} value={codes[p.id] ?? ""} onChange={e => setCodes(c => ({ ...c, [p.id]: e.target.value }))} maxLength={6} /></div>
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
                    <div className="cd-prow__st">
                      {isVerified
                        ? <span className="badge badge-compliant">{t.verified}</span>
                        : p.joined_at
                          ? <span className="ax-lozenge ax-lozenge--virtual ax-lozenge--info">{t.joinedAwaiting}</span>
                          : <span className="badge">{t.notJoined}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* provider-pending room — bounded, never a call surface */}
          <section className="panel cd-side cd-room" aria-label={t.room}>
            <div className="cd-sectionhead"><h3>{t.room}</h3><span className="cd-tag cd-tag--blocked">{t.roomTag}</span></div>
            {simVideo ? (
              <div className="stack" style={{ gap: "var(--space-2)" }}>
                <span className="badge badge-warning" role="status">{t.simulatedSession}</span>
                <div className="cd-roombox" role="img" aria-label={simVideo.state}>
                  <span className="cd-roombox__glyph" aria-hidden="true">{simVideo.state === "connected" ? "●" : simVideo.state === "degraded" ? "▲" : "✕"}</span>
                  <span className="cd-roombox__lab">{simVideo.state.replace(/_/g, " ")}</span>
                </div>
                <p className="t-caption">camera: {simVideo.camera} · mic: {simVideo.mic} · fixture: {simVideo.fixtureId}</p>
                <p className="t-caption">Test/staging simulation only — no real media connection exists (provider={simVideo.provider}).</p>
              </div>
            ) : (
              <div className="cd-roombox" role="img" aria-label={t.roomPending}><span className="cd-roombox__glyph" aria-hidden="true">▲</span><span className="cd-roombox__lab">{t.roomPending}</span></div>
            )}
            <p className="cd-sub">{t.roomBody}</p>
            <p className="cd-sub">{t.roomContinue}</p>
          </section>

          {/* fallback route — bounded, no invented policy */}
          <section className="panel cd-side" aria-label={t.fallback}>
            <div className="cd-sectionhead"><h3>{t.fallback}</h3><span className="cd-tag cd-tag--blocked">{t.fallbackTag}</span></div>
            <p className="cd-sub">{t.fallbackBody}</p>
            <p className="cd-sub">{t.fallbackResched}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
