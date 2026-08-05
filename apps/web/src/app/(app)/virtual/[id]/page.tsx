import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import Room, { type RoomStrings, type RoomTimelineRow } from "./Room";
import { type RoomStageStrings } from "./RoomStage";
import EmptyState from "@/components/EmptyState";
import { IconShieldCheck } from "@/app/icons";
import { videoTransportStatus, videoRoomJoinable } from "@/lib/providers/video-twilio";

type TimelineEvent = { event: string; at: string; actor?: string | null; detail?: Record<string, unknown> | null };

const STATE_TONE: Record<string, string> = {
  verified: "sq-lozenge--success", in_progress: "sq-lozenge--success",
  closed: "sq-lozenge--critical",
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
        body={t("virtual.room.notFoundDesc", "Access denied safely; attempt audited ( failure state).")} />
    </Shell>;
  }
  const strings: RoomStrings = {
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
    otpCooldown: t("virtual.room.otpCooldown", "cooldown — retry in {s}s"),
    otpVerified: t("virtual.room.otpVerified", "verified ✓ — bound to session"),
    otpWrong: t("virtual.room.otpWrong", "wrong — {n} attempts left, then lock (no bypass)"),
    otpLocked: t("virtual.room.otpLocked", "locked — attempts exhausted; resend or escalate (audited exception)"),
    otpExpired: t("virtual.room.otpExpired", "code expired — request a new one"),
    otpExhausted: t("virtual.room.otpExhausted", "resends exhausted — supervisor-approved manual verification only (audited)"),
    otpNoCode: t("virtual.room.otpNoCode", "no active code — send one first"),
    otpError: t("virtual.room.otpError", "Identity verification is temporarily unavailable. Try again or escalate."),
    otpCounters: t("virtual.room.otpCounters", "attempts {a}/{b} · resends {c}/{d} ( policy, server-enforced)"),
    beginReady: t("virtual.room.beginReady", "Begin remote inspection → same screen & submission flow"),
    beginGated: t("virtual.room.beginGated", "Verification gates execution (no bypass)"),
    openWaiting: t("virtual.room.openWaiting", "Open waiting room"),
    rescheduleTitle: t("virtual.room.rescheduleTitle", "Reschedule"),
    rescheduleLabel: t("virtual.room.rescheduleLabel", "New appointment (participants re-notified)"),
    rescheduleSubmit: t("virtual.room.rescheduleSubmit", "Reschedule appointment"),
    closeTitle: t("virtual.room.closeTitle", "Close / cancel session"),
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
    fallbackBody: t("virtual.room.fallbackBody", "The video provider is unavailable. The session state and audit trail are preserved; no call is connected."),
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
    timelineHeading: t("virtual.room.timelineHeading", "Session timeline ( · audited)"),
    timelineEmpty: t("virtual.room.timelineEmpty", "No events yet — the timeline records scheduling, joins, verification, start and close."),
    identityHeading: t("virtual.room.identityHeading", "Identity verification — OTP (no bypass)"),
  };
  // WA-DES-044 — the room panel. Local media is a browser capability and works
  // now; the remote leg needs Twilio Video credentials, so its availability is
  // read from the server and never inferred in the browser.
  // Two DIFFERENT facts, and conflating them would put a false promise on the
  // page: `configured` means the Twilio credentials exist, `joinable` means a
  // participant could actually connect. The API key landed 2026-07-26, so
  // configured is now true while the client SDK connect is still unbuilt — the
  // panel must keep saying nobody can join, and say WHY in the right words.
  const transport = videoTransportStatus();
  const joinable = videoRoomJoinable();
  const stage: RoomStageStrings = {
    title: t("virtual.stage.title", "Inspection room"),
    statusReady: t("virtual.stage.statusReady", "ready to connect"),
    statusNotReady: t("virtual.stage.statusNotReady", "no one can join yet"),
    stateConnected: t("virtual.stage.stateConnected", "Connected"),
    stateLocalOnly: t("virtual.stage.stateLocalOnly", "Your devices only"),
    stateUnavailable: t("virtual.stage.stateUnavailable", "Room not available"),
    remoteWaiting: t("virtual.stage.remoteWaiting", "No one else is in this room yet."),
    remoteRepNoRoute: t("virtual.stage.remoteRepNoRoute", "The factory representative cannot join. This room is reachable only from the console."),
    // Same "cannot join" outcome, two different causes — and telling the
    // operator the wrong one wastes their time. Before the API key existed the
    // service was genuinely off; now it is configured and the gap is this build.
    remoteUnavailable: transport.configured
      ? t("virtual.stage.remoteUnavailableNoClient", "The video service is configured, but joining a room is not available, so the representative cannot join.")
      : t("virtual.stage.remoteUnavailable", "The video service is not switched on for this environment, so the representative cannot join."),
    remoteUnavailableReason: t("virtual.stage.remoteUnavailableReason", "Your camera, microphone and screen sharing still work below, and the rest of the session — identity checks, the appointment, the decision to begin and the audit trail — runs now."),
    selfView: t("virtual.stage.selfView", "Your camera"),
    cameraOff: t("virtual.stage.cameraOff", "Camera off"),
    cameraOn: t("virtual.stage.cameraOn", "Camera on"),
    micOff: t("virtual.stage.micOff", "Microphone off"),
    micOn: t("virtual.stage.micOn", "Microphone on"),
    share: t("virtual.stage.share", "Share screen"),
    shareStop: t("virtual.stage.shareStop", "Stop sharing"),
    leave: t("virtual.stage.leave", "Leave room"),
    stopDevices: t("virtual.stage.stopDevices", "Turn off my devices"),
    sharingLabel: t("virtual.stage.sharingLabel", "Sharing your screen"),
    note: t("virtual.stage.note", "Your devices are released when you leave the room or close this page. Nothing here is a simulated call."),
    errDenied: t("virtual.stage.errDenied", "Your browser blocked access. Allow camera and microphone for this site, then try again."),
    errNotFound: t("virtual.stage.errNotFound", "No camera or microphone was found on this device."),
    errBusy: t("virtual.stage.errBusy", "The device is already in use by another application. Close it and try again."),
    errUnsupported: t("virtual.stage.errUnsupported", "This browser does not support camera, microphone or screen sharing here."),
    errGeneric: t("virtual.stage.errGeneric", "The device could not be started. Try again or use a different device."),
    join: t("virtual.stage.join", "Join room"),
    joining: t("virtual.stage.joining", "Joining…"),
    stateNotJoined: t("virtual.stage.stateNotJoined", "Not in the room"),
    joinedWith: t("virtual.stage.joinedWith", "Connected · {n} other in the room"),
    joinedAlone: t("virtual.stage.joinedAlone", "Connected · waiting for others"),
    errJoin: t("virtual.stage.errJoin", "The room could not be joined. Check your connection and try again."),
  };
  // S13 — server-authoritative revision the client acts against (state + append-only
  // timeline length). A mismatch on submit means the session moved on concurrently.
  const rev = `${s.state}:${((s.timeline as unknown[]) ?? []).length}`;
  const events = ((s.timeline as unknown as TimelineEvent[]) ?? []).slice().reverse();
  const eventLabels: Record<string, string> = {
    scheduled: t("virtual.tl.scheduled", "session scheduled"),
    rescheduled: t("virtual.tl.rescheduled", "appointment rescheduled"),
    waiting_opened: t("virtual.tl.waitingOpened", "waiting room opened"),
    joined: t("virtual.tl.joined", "participant joined"),
    verified: t("virtual.tl.verified", "identity verified"),
    begin: t("virtual.tl.begin", "remote inspection started"),
    closed: t("virtual.tl.closed", "session closed"),
  };
  // WA-DES-044 — the timeline renders in the room's side column now, so its rows
  // are formatted here (server-side) and handed over ready to display. Dates
  // formatted in the browser instead would drift from the SSR output.
  const timelineRows: RoomTimelineRow[] = events.map(ev => {
    return {
      at: ev.at ? formatDateTime(ev.at, dLang) : "—",
      label: eventLabels[ev.event] ?? ev.event.replace(/_/g, " "),
      detail: [
        ev.detail?.participant ? String(ev.detail.participant) : "",
        ev.detail?.reason ? String(ev.detail.reason) : "",
        ev.detail?.appointment_at ? String(ev.detail.appointment_at).slice(0, 16).replace("T", " ") : "",
      ].filter(Boolean).map(part => { return ` · ${part}`; }).join(""),
    };
  });
  return (
    <Shell current="/virtual" title={t("virtual.room.title", "Virtual room — {factory}").replace("{factory}", (s.visits as unknown as { factories: { name: string } }).factories.name)}
      context={<>
        <span className="sq-numeric sq-caption">{formatDateTime(s.appointment_at, dLang)}</span>
        <span className={`sq-lozenge sq-lozenge--virtual ${STATE_TONE[s.state] ?? "sq-lozenge--info"}`}>{t(`enum.${s.state}`, s.state.replace(/_/g, " "))}</span>
      </>}>
      <Room session={s as never} strings={strings} rev={rev} stage={stage}
        transportConfigured={joinable} timeline={timelineRows} />
    </Shell>
  );
}
