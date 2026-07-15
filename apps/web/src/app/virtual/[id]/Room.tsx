"use client";
import { useActionState, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import {
  beginRemote, closeSession, joinParticipant, markSessionVerified,
  openWaitingRoom, rescheduleSession, type RoomActionResult,
} from "./actions";

type P = { id: string; display_name: string; role: string; joined_at: string | null; verified_at: string | null };
type S = { id: string; state: string; appointment_at: string; visit_id: string; virtual_participants: P[] };
type OtpStatus = {
  status: string; verified?: boolean; locked?: boolean; has_active_code?: boolean;
  attempts_used?: number; attempts_max?: number; resends_used?: number; resends_max?: number; expires_at?: string | null;
};

// SB19 — strings built server-side with t() and passed as props.
export type RoomStrings = {
  adapterTitle: string; adapterBody: string; adapterPending: string; videoPlaceholder: string;
  roles: Record<string, string>;
  verified: string; joinedAwaiting: string; notJoined: string;
  markJoined: string;
  sendOtp: string; resendOtp: string; devCode: string; codeLabel: string; verify: string;
  otpSent: string; otpCooldown: string; otpVerified: string; otpWrong: string; otpLocked: string; otpExpired: string; otpExhausted: string; otpNoCode: string;
  otpError: string;
  otpCounters: string;   // "attempts {a}/{b} · resends {c}/{d}"
  beginReady: string; beginGated: string;
  openWaiting: string;
  rescheduleTitle: string; rescheduleLabel: string; rescheduleSubmit: string;
  closeTitle: string; closeReason: string; closeComments: string; closeSubmit: string; closeWorking: string;
  working: string;
};

const fmt = (s: string, vars: Record<string, string | number>) => { return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m) as string); };

export default function Room({ session, strings }: { session: S; strings: RoomStrings }) {
  const [parts] = useState(session.virtual_participants);
  const [otpInfo, setOtpInfo] = useState({} as Record<string, { dev_code?: string; msg: string }>);
  const [otpStatus, setOtpStatus] = useState({} as Record<string, OtpStatus>);
  const [verifiedIds, setVerifiedIds] = useState(() => new Set(parts.filter(p => { return !!p.verified_at; }).map(p => { return p.id; })));
  const [codes, setCodes] = useState({} as Record<string, string>);
  const [busy, setBusy] = useState(false);
  const sb = supabaseBrowser();

  const [joinState, joinAction, joinPending] = useActionState<RoomActionResult, FormData>(joinParticipant, {});
  const [waitState, waitAction, waitPending] = useActionState<RoomActionResult, FormData>(openWaitingRoom, {});
  const [reschedState, reschedAction, reschedPending] = useActionState<RoomActionResult, FormData>(rescheduleSession, {});
  const [closeState, closeAction, closePending] = useActionState<RoomActionResult, FormData>(closeSession, {});
  const [beginState, beginAction, beginPending] = useActionState<RoomActionResult, FormData>(beginRemote, {});

  // M05-014/016 — live attempts/resend counters from the safe status RPC
  // (verification_record itself never reaches the client — hash stays server-side).
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
      // 0023 — the RPC now rejects callers with no authority over this session (RBAC-014).
      // Provider/RLS detail remains diagnostic-only; show stable localized copy.
      // eslint-disable-next-line no-console
      console.error("[virtual otp request]", error);
      setOtpInfo(o => ({ ...o, [p.id]: { msg: strings.otpError } }));
      setBusy(false);
      return;
    }
    const d = data as { status: string; dev_code?: string; retry_after_s?: number; resends_left?: number };
    setOtpInfo(o => ({
      ...o, [p.id]: {
        dev_code: d.dev_code,
        msg: d.status === "sent" ? fmt(strings.otpSent, { n: d.resends_left ?? 0 })
          : d.status === "cooldown" ? fmt(strings.otpCooldown, { s: d.retry_after_s ?? 0 })
          : d.status === "exhausted" ? strings.otpExhausted : d.status,
      },
    }));
    await refreshStatus(p.id);
    setBusy(false);
  }

  async function verify(p: P) {
    setBusy(true);
    const { data, error } = await sb.rpc("vp_verify_otp", { p_participant: p.id, p_code: codes[p.id] ?? "" });
    if (error) {
      // 0023 — the RPC now rejects callers with no authority over this session (RBAC-014).
      // Provider/RLS detail remains diagnostic-only; show stable localized copy.
      // eslint-disable-next-line no-console
      console.error("[virtual otp verify]", error);
      setOtpInfo(o => ({ ...o, [p.id]: { msg: strings.otpError } }));
      setBusy(false);
      return;
    }
    const d = data as { status: string; attempts_left?: number };
    if (d.status === "verified") {
      setVerifiedIds(v => new Set([...v, p.id]));
      setOtpInfo(o => ({ ...o, [p.id]: { msg: strings.otpVerified } }));
      // Guarded server transition + timeline event (M05-003/018).
      const fd = new FormData();
      fd.set("session_id", session.id); fd.set("participant_id", p.id);
      await markSessionVerified({}, fd);
    } else {
      const msg = d.status === "wrong" ? fmt(strings.otpWrong, { n: d.attempts_left ?? 0 })
        : d.status === "locked" ? strings.otpLocked
        : d.status === "expired" ? strings.otpExpired
        : d.status === "no_code" ? strings.otpNoCode : d.status;
      setOtpInfo(o => ({ ...o, [p.id]: { ...o[p.id], msg } }));
    }
    await refreshStatus(p.id);
    setBusy(false);
  }

  const allVerified = parts.filter(p => { return p.role === "factory_rep"; }).every(p => { return verifiedIds.has(p.id); });
  const open = session.state !== "closed";
  const errors = [joinState.error, waitState.error, reschedState.error, closeState.error, beginState.error].filter(Boolean);
  const oks = [joinState.ok, waitState.ok, reschedState.ok, closeState.ok].filter(Boolean);
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      {/* Live-video provider adapter — the ONLY contract-sanctioned deferral (DEC). */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", minBlockSize: 180, background: "var(--ax-color-text)", borderRadius: "var(--ax-radius-large)", display: "grid", placeItems: "center", color: "var(--ax-color-inverse-text)" }}>
        <div style={{ textAlign: "center", display: "grid", gap: "var(--ax-space-100)", justifyItems: "center" }}>
          <span className="ax-lozenge ax-lozenge--warning">{strings.adapterPending}</span>
          <strong style={{ color: "inherit" }}>{strings.adapterTitle}</strong>
          <p className="ax-caption" style={{ color: "inherit", opacity: .7, maxInlineSize: 480 }}>{strings.adapterBody}</p>
        </div>
      </div>
      {errors.map((e, i) => <div key={i} className="ax-banner ax-banner--critical" role="alert"><div>{e}</div></div>)}
      {oks.map((m, i) => <div key={i} className="ax-banner ax-banner--success"><div>{m}</div></div>)}
      {open && session.state === "scheduled" && (
        <form action={waitAction} className="ax-row">
          <input type="hidden" name="session_id" value={session.id} />
          <button className="ax-btn ax-btn--secondary" disabled={waitPending}>{waitPending ? strings.working : strings.openWaiting}</button>
        </form>
      )}
      {parts.map(p => {
        const isVerified = verifiedIds.has(p.id);
        const st = otpStatus[p.id];
        return (
          <div key={p.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <strong>{p.display_name} · {strings.roles[p.role] ?? p.role.replace(/_/g, " ")}</strong>
              {isVerified
                ? <span className="ax-lozenge ax-lozenge--success">{strings.verified}</span>
                : p.joined_at
                  ? <span className="ax-lozenge ax-lozenge--virtual ax-lozenge--info">{strings.joinedAwaiting}</span>
                  : <span className="ax-lozenge">{strings.notJoined}</span>}
            </div>
            {open && !p.joined_at && (
              <form action={joinAction} className="ax-row">
                <input type="hidden" name="session_id" value={session.id} />
                <input type="hidden" name="participant_id" value={p.id} />
                <button className="ax-btn ax-btn--secondary" disabled={joinPending}>{joinPending ? strings.working : strings.markJoined}</button>
              </form>
            )}
            {open && !isVerified && p.role === "factory_rep" && (
              <>
                <div className="ax-row" style={{ alignItems: "flex-end" }}>
                  <button className="ax-btn ax-btn--secondary" onClick={() => requestOtp(p)} disabled={busy || !!st?.locked}>
                    {st?.has_active_code || (st?.resends_used ?? 0) > 0 ? strings.resendOtp : strings.sendOtp}
                  </button>
                  {otpInfo[p.id]?.dev_code && <span className="ax-lozenge ax-lozenge--warning">{strings.devCode} {otpInfo[p.id].dev_code}</span>}
                  <div className="ax-field" style={{ maxInlineSize: 160 }}><label className="ax-field__label">{strings.codeLabel}</label>
                    <input className="ax-input ax-numeric" value={codes[p.id] ?? ""} onChange={e => setCodes(c => ({ ...c, [p.id]: e.target.value }))} maxLength={6} /></div>
                  <button className="ax-btn" onClick={() => verify(p)} disabled={busy || !!st?.locked}>{strings.verify}</button>
                </div>
                {st?.status === "ok" && (
                  <p className="ax-caption ax-numeric">
                    {fmt(strings.otpCounters, { a: st.attempts_used ?? 0, b: st.attempts_max ?? 0, c: st.resends_used ?? 0, d: st.resends_max ?? 0 })}
                    {st.locked && <> · <span className="ax-lozenge ax-lozenge--critical">{strings.otpLocked}</span></>}
                  </p>
                )}
              </>
            )}
            {otpInfo[p.id]?.msg && <p className="ax-caption">{otpInfo[p.id].msg}</p>}
          </div>
        );
      })}
      {open && (
        <form action={beginAction} className="ax-row" style={{ justifyContent: "flex-end" }}>
          <input type="hidden" name="session_id" value={session.id} />
          <button className="ax-btn ax-btn--prominent ax-btn--field" disabled={!allVerified || beginPending}>
            {beginPending ? strings.working : allVerified ? strings.beginReady : strings.beginGated}
          </button>
        </form>
      )}
      {open && ["scheduled", "waiting"].includes(session.state) && (
        <form action={reschedAction} className="ax-surface ax-row" style={{ padding: "var(--ax-space-300)", alignItems: "flex-end" }}>
          <input type="hidden" name="session_id" value={session.id} />
          <div className="ax-field"><label className="ax-field__label">{strings.rescheduleLabel}</label>
            <input className="ax-input ax-numeric" type="datetime-local" name="appointment_at" defaultValue={session.appointment_at.slice(0, 16)} required /></div>
          <button className="ax-btn ax-btn--secondary" disabled={reschedPending}>{reschedPending ? strings.working : strings.rescheduleSubmit}</button>
        </form>
      )}
      {open && (
        <form action={closeAction} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <h4>{strings.closeTitle}</h4>
          <input type="hidden" name="session_id" value={session.id} />
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.closeReason} <span className="ax-req">*</span></label>
            <input className="ax-input" name="reason" required /></div>
          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label">{strings.closeComments}</label>
            <textarea className="ax-textarea" name="comments" rows={2} /></div>
          <div className="ax-row" style={{ justifyContent: "flex-end" }}>
            <button className="ax-btn" disabled={closePending}>{closePending ? strings.closeWorking : strings.closeSubmit}</button>
          </div>
        </form>
      )}
    </div>
  );
}
