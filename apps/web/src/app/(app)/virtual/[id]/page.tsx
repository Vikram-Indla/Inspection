import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import Room, { type RoomStrings } from "./Room";
import EmptyState from "@/components/EmptyState";
import { IconShieldCheck } from "@/app/icons";

type TimelineEvent = { event: string; at: string; actor?: string | null; detail?: Record<string, unknown> | null };

const STATE_TONE: Record<string, string> = {
  verified: "ax-lozenge--success", in_progress: "ax-lozenge--success",
  closed: "ax-lozenge--critical",
};

export default async function VirtualRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await useT();
  const dLang = locale === "ar" ? "ar" : "en";
  const sb = await supabaseServer();
  const { data: s } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, timeline, visit_id, visits(factories(name, factory_code, cr_number), package_versions(id, version_label, packages(code)), inspections(id, status)), virtual_participants(id, display_name, role, joined_at, verified_at)")
    .eq("id", id).single();
  if (!s) {
    return <Shell current="/virtual" title={t("virtual.room.notFoundTitle", "Session not found")}>
      <EmptyState icon={<IconShieldCheck size={28} />} title={t("virtual.room.notFound", "Wrong appointment or out of scope")}
        body={t("virtual.room.notFoundDesc", "Access denied safely; attempt audited (SCR-VIR-700 failure state).")} />
    </Shell>;
  }
  const strings: RoomStrings = {
    adapterTitle: t("virtual.room.adapterTitle", "Secure session room"),
    adapterBody: t("virtual.room.adapterBody", "Live-video provider adapter — provider selection is a contract decision (DEC); everything around it (identity verification, state machine, timeline, audit) runs live."),
    adapterPending: t("virtual.room.adapterPending", "video provider pending"),
    videoPlaceholder: t("virtual.room.videoPlaceholder", "secure session room — video provider adapter (release integration); capture controls overlay here"),
    simulatedSession: t("virtual.room.simulatedSession", "SIMULATED VIDEO SESSION"),
    roles: {
      factory_rep: t("enum.factory_rep", "factory rep"),
      inspector: t("enum.inspector", "inspector"),
      agent: t("enum.agent", "agent"),
    },
    verified: t("virtual.room.verified", "verified"),
    joinedAwaiting: t("virtual.room.joinedAwaiting", "joined — awaiting verification"),
    notJoined: t("virtual.room.notJoined", "not joined"),
    markJoined: t("virtual.room.markJoined", "Mark joined"),
    sendOtp: t("virtual.room.sendOtp", "Send OTP"),
    resendOtp: t("virtual.room.resendOtp", "Resend OTP"),
    devCode: t("virtual.room.devCode", "DEV code:"),
    codeLabel: t("virtual.room.codeLabel", "Code"),
    verify: t("virtual.room.verify", "Verify"),
    otpSent: t("virtual.room.otpSent", "sent · DEV provider shows code (release: Unifonic) · {n} resends left"),
    otpCooldown: t("virtual.room.otpCooldown", "cooldown — retry in {s}s (DEC-007)"),
    otpVerified: t("virtual.room.otpVerified", "verified ✓ — bound to session (STM-VIR-002)"),
    otpWrong: t("virtual.room.otpWrong", "wrong — {n} attempts left, then lock (no bypass)"),
    otpLocked: t("virtual.room.otpLocked", "locked — attempts exhausted; resend or escalate (audited exception)"),
    otpExpired: t("virtual.room.otpExpired", "code expired — request a new one"),
    otpExhausted: t("virtual.room.otpExhausted", "resends exhausted — supervisor-approved manual verification only (audited)"),
    otpNoCode: t("virtual.room.otpNoCode", "no active code — send one first"),
    otpError: t("virtual.room.otpError", "Identity verification is temporarily unavailable. Try again or escalate."),
    otpCounters: t("virtual.room.otpCounters", "attempts {a}/{b} · resends {c}/{d} (DEC-007 policy, server-enforced)"),
    beginReady: t("virtual.room.beginReady", "Begin remote inspection → same workspace & submission flow"),
    beginGated: t("virtual.room.beginGated", "Verification gates execution (no bypass)"),
    openWaiting: t("virtual.room.openWaiting", "Open waiting room"),
    rescheduleTitle: t("virtual.room.rescheduleTitle", "Reschedule"),
    rescheduleLabel: t("virtual.room.rescheduleLabel", "New appointment (participants re-notified)"),
    rescheduleSubmit: t("virtual.room.rescheduleSubmit", "Reschedule appointment"),
    closeTitle: t("virtual.room.closeTitle", "Close / cancel session (M05-005)"),
    closeReason: t("virtual.room.closeReason", "Reason"),
    closeComments: t("virtual.room.closeComments", "Comments"),
    closeSubmit: t("virtual.room.closeSubmit", "Close session"),
    closeWorking: t("virtual.room.closeWorking", "Closing…"),
    working: t("virtual.room.working", "Working…"),
    contract: t("virtual.room.contract", "Readiness contract"),
    contractHint: t("virtual.room.contractHint", "Every gate is shown from stored session facts; no client-only bypass is accepted."),
    apptLink: t("virtual.room.apptLink", "Appointment and scope"),
    timeLink: t("virtual.room.timeLink", "Appointment time"),
    partLink: t("virtual.room.partLink", "Participants"),
    stateLink: t("virtual.room.stateLink", "Session state"),
    transLink: t("virtual.room.transLink", "Transition"),
    fbLink: t("virtual.room.fbLink", "Fallback"),
    ready: t("virtual.room.ready", "ready"),
    missing: t("virtual.room.missing", "missing"),
    blocked: t("virtual.room.blocked", "blocked"),
    pendingWord: t("virtual.room.pendingWord", "pending"),
    scopeOk: t("virtual.room.scopeOk", "scope confirmed"),
    factory: t("virtual.room.factory", "Factory"),
    sessionWord: t("virtual.room.session", "Session"),
    visitWord: t("virtual.room.visit", "Visit"),
    pkg: t("virtual.room.package", "Package"),
    inspectionWord: t("virtual.room.inspection", "Inspection"),
    inspNone: t("virtual.room.inspectionNone", "No inspection started"),
    apptStored: t("virtual.room.apptStored", "Stored appointment"),
    apptTz: t("virtual.room.apptTz", "Displayed in the stored appointment timezone."),
    tzBlocked: t("virtual.room.tzBlocked", "timezone conversion unavailable"),
    early: t("virtual.room.early", "The appointment window has not opened."),
    onwindow: t("virtual.room.onwindow", "The appointment is in its active window."),
    late: t("virtual.room.late", "The stored appointment time has passed."),
    lateDerived: t("virtual.room.lateDerived", "Late is a client-clock hint only; the server transition remains authoritative."),
    relEarly: t("virtual.room.relEarly", "early"),
    relLate: t("virtual.room.relLate", "late"),
    partHint: t("virtual.room.partHint", "Every required representative must join and be verified before the remote inspection can begin."),
    you: t("virtual.room.you", "you"),
    inspectorRole: t("enum.inspector", "inspector"),
    repRole: t("enum.factory_rep", "factory representative"),
    awaiting: t("virtual.room.awaiting", "awaiting verification"),
    statePath: t("virtual.room.statePath", "State path"),
    statePathHint: t("virtual.room.statePathHint", "The session timeline is append-only and server-authoritative."),
    s_scheduled: t("enum.scheduled", "scheduled"),
    s_waiting: t("enum.waiting", "waiting"),
    s_joined: t("enum.joined", "joined"),
    s_verified: t("enum.verified", "verified"),
    s_inprogress: t("enum.in_progress", "in progress"),
    s_closed: t("enum.closed", "closed"),
    now: t("virtual.room.now", "now"),
    done: t("virtual.room.done", "done"),
    next: t("virtual.room.next", "next"),
    nowLabel: t("virtual.room.nowLabel", "Current state"),
    room: t("virtual.room.room", "Room"),
    roomPending: t("virtual.room.roomPending", "Room provider pending"),
    roomBody: t("virtual.room.roomBody", "The provider adapter is not connected; readiness and audit remain available."),
    roomTag: t("virtual.room.roomTag", "provider handoff"),
    roomContinue: t("virtual.room.roomContinue", "Continue when the provider is connected."),
    transition: t("virtual.room.transition", "Next transition"),
    transHint: t("virtual.room.transHint", "Use the single allowed transition below."),
    actOpenSub: t("virtual.room.actOpenSub", "Open the governed waiting room."),
    actJoinSub: t("virtual.room.actJoinSub", "Record your participant join."),
    actBegin: t("virtual.room.actBegin", "Begin remote inspection"),
    actBeginSub: t("virtual.room.actBeginSub", "All required representatives are verified."),
    actContinue: t("virtual.room.actContinue", "Continue remote inspection"),
    actContinueSub: t("virtual.room.actContinueSub", "The session is already in progress."),
    actReschedule: t("virtual.room.actReschedule", "Reschedule"),
    actRescheduleSub: t("virtual.room.actRescheduleSub", "Store a new appointment and audit the change."),
    actClose: t("virtual.room.actClose", "Close session"),
    actCloseSub: t("virtual.room.actCloseSub", "Close or cancel with a recorded reason."),
    needVerify: t("virtual.room.needVerify", "Verify every required representative first."),
    guardClosed: t("virtual.room.guardClosed", "Closed sessions cannot transition."),
    guardLate: t("virtual.room.guardLate", "The appointment is outside its stored window."),
    reschedNo: t("virtual.room.reschedNo", "This session cannot be rescheduled in its current state."),
    reasonLabel: t("virtual.room.reasonLabel", "Reason"),
    reasonPh: t("virtual.room.reasonPh", "Required reason (recorded immutably)"),
    reasonReq: t("virtual.room.reasonReq", "A reason is required."),
    fallback: t("virtual.room.fallback", "Fallback"),
    fallbackBody: t("virtual.room.fallbackBody", "If the provider is unavailable, keep the session state and audit trail; do not claim a video connection."),
    fallbackTag: t("virtual.room.fallbackTag", "provider unavailable"),
    fallbackResched: t("virtual.room.fallbackResched", "Reschedule or escalate through the governed path."),
    degraded: t("virtual.room.degraded", "Related source unavailable"),
    degradedBody: t("virtual.room.degradedBody", "Some linked appointment data could not be loaded; no missing fact is inferred."),
    emptyPart: t("virtual.room.emptyPart", "No participants are recorded for this session."),
    closedTitle: t("virtual.room.closedTitle", "Session closed — read-only"),
    closedBody: t("virtual.room.closedBody", "This session is immutable; the recorded reason is preserved on the timeline."),
    closedHandoff: t("virtual.room.closedHandoff", "Closing is not submission approval — continue on the inspection engine for submission and Level 2 (P08) review."),
    offlineTitle: t("virtual.room.offlineTitle", "You are offline"),
    offlineBody: t("virtual.room.offlineBody", "Begin, reschedule and close are disabled. Nothing is queued and no reconnection is promised — reload when your connection returns."),
    staleTitle: t("virtual.room.staleTitle", "This session changed"),
    staleBody: t("virtual.room.staleBody", "A concurrent change was detected, so nothing was submitted. Reload to see the latest state before acting again."),
    reload: t("virtual.room.reload", "Reload"),
  };
  // S13 — server-authoritative revision the client acts against (state + append-only
  // timeline length). A mismatch on submit means the session moved on concurrently.
  const rev = `${s.state}:${((s.timeline as unknown[]) ?? []).length}`;
  const timeline = ((s.timeline as unknown as TimelineEvent[]) ?? []).slice().reverse();
  const eventLabels: Record<string, string> = {
    scheduled: t("virtual.tl.scheduled", "session scheduled"),
    rescheduled: t("virtual.tl.rescheduled", "appointment rescheduled"),
    waiting_opened: t("virtual.tl.waitingOpened", "waiting room opened"),
    joined: t("virtual.tl.joined", "participant joined"),
    verified: t("virtual.tl.verified", "identity verified"),
    begin: t("virtual.tl.begin", "remote inspection started"),
    closed: t("virtual.tl.closed", "session closed"),
  };
  return (
    <Shell current="/virtual" title={t("virtual.room.title", "Virtual room — {factory}").replace("{factory}", (s.visits as unknown as { factories: { name: string } }).factories.name)}
      context={<>
        <span className="ax-numeric ax-caption">{formatDateTime(s.appointment_at, dLang)}</span>
        <span className={`ax-lozenge ax-lozenge--virtual ${STATE_TONE[s.state] ?? "ax-lozenge--info"}`}>{t(`enum.${s.state}`, s.state.replace(/_/g, " "))}</span>
      </>}>
      <Room session={s as never} strings={strings} rev={rev} />
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("virtual.room.timelineHeading", "Session timeline (M05-003 · audited)")}</h4>
        {timeline.length === 0 && <p className="ax-caption">{t("virtual.room.timelineEmpty", "No events yet — the timeline records scheduling, joins, verification, start and close.")}</p>}
        {timeline.map((ev, i) => (
          <p key={i} className="ax-caption" style={{ marginBlockStart: 4 }}>
            <span className="ax-numeric">{ev.at ? formatDateTime(ev.at, dLang) : "—"}</span>
            {" · "}<strong>{eventLabels[ev.event] ?? ev.event.replace(/_/g, " ")}</strong>
            {ev.detail?.participant ? ` · ${String(ev.detail.participant)}` : ""}
            {ev.detail?.reason ? ` · ${String(ev.detail.reason)}` : ""}
            {ev.detail?.appointment_at ? <span className="ax-numeric"> · {String(ev.detail.appointment_at).slice(0, 16).replace("T", " ")}</span> : ""}
          </p>
        ))}
      </div>
    </Shell>
  );
}
