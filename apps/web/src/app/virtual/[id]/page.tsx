import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Room, { type RoomStrings } from "./Room";

export const dynamic = "force-dynamic";

type TimelineEvent = { event: string; at: string; actor?: string | null; detail?: Record<string, unknown> | null };

const STATE_TONE: Record<string, string> = {
  verified: "ax-lozenge--success", in_progress: "ax-lozenge--success",
  closed: "ax-lozenge--critical",
};

export default async function VirtualRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: s } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, timeline, visit_id, visits(factories(name), package_versions(id), inspections(id, status)), virtual_participants(id, display_name, role, joined_at, verified_at)")
    .eq("id", id).single();
  if (!s) {
    return <Shell current="/virtual" title={t("virtual.room.notFoundTitle", "Session not found")}><div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🛡</span><h4>{t("virtual.room.notFound", "Wrong appointment or out of scope")}</h4><p className="ax-caption">{t("virtual.room.notFoundDesc", "Access denied safely; attempt audited (SCR-VIR-700 failure state).")}</p></div></div></Shell>;
  }
  const strings: RoomStrings = {
    adapterTitle: t("virtual.room.adapterTitle", "Secure session room"),
    adapterBody: t("virtual.room.adapterBody", "Live-video provider adapter — provider selection is a contract decision (DEC); everything around it (identity verification, state machine, timeline, audit) runs live."),
    adapterPending: t("virtual.room.adapterPending", "video provider pending"),
    videoPlaceholder: t("virtual.room.videoPlaceholder", "secure session room — video provider adapter (release integration); capture controls overlay here"),
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
  };
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
        <span className="ax-numeric ax-caption">{new Date(s.appointment_at).toISOString().slice(0, 16).replace("T", " ")}</span>
        <span className={`ax-lozenge ax-lozenge--virtual ${STATE_TONE[s.state] ?? "ax-lozenge--info"}`}>{t(`enum.${s.state}`, s.state.replace(/_/g, " "))}</span>
      </>}>
      <Room session={s as never} strings={strings} />
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)", marginBlockStart: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("virtual.room.timelineHeading", "Session timeline (M05-003 · audited)")}</h4>
        {timeline.length === 0 && <p className="ax-caption">{t("virtual.room.timelineEmpty", "No events yet — the timeline records scheduling, joins, verification, start and close.")}</p>}
        {timeline.map((ev, i) => (
          <p key={i} className="ax-caption" style={{ marginBlockStart: 4 }}>
            <span className="ax-numeric">{ev.at ? new Date(ev.at).toISOString().slice(0, 16).replace("T", " ") : "—"}</span>
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
