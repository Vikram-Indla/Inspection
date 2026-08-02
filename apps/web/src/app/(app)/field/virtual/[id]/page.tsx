import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { videoRoomJoinable } from "@/lib/providers/video-twilio";
import { type RoomStageStrings } from "@/app/(app)/virtual/[id]/RoomStage";
import VirtualSessionClient, { type FieldVirtualSession } from "./VirtualSessionClient";

const STATE_LABELS: Record<string, { en: string; ar: string }> = {
  scheduled: { en: "Scheduled", ar: "مجدولة" },
  waiting: { en: "Waiting room", ar: "غرفة الانتظار" },
  joined: { en: "Joined", ar: "تم الانضمام" },
  verified: { en: "Verified", ar: "تم التحقق" },
  in_progress: { en: "In progress", ar: "قيد التنفيذ" },
  closed: { en: "Closed", ar: "مغلقة" },
};

export default async function FieldVirtualSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");
  const { data, error } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, timeline, visit_id, visits(id, package_versions(version_label, packages(code)), factories(name, factory_code), assignments(inspector_id), inspections(id, status)), virtual_participants(id, display_name, role, joined_at, verified_at)")
    .eq("id", id).single();
  if (error || !data) notFound();
  const session = data as unknown as FieldVirtualSession;
  if (!session.visits?.assignments?.some(a => a.inspector_id === user.id)) notFound();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const stateLabel = STATE_LABELS[session.state];
  const stage: RoomStageStrings = {
    title: t("virtual.stage.title", "Inspection room"),
    statusReady: t("virtual.stage.statusReady", "Ready to connect"),
    statusNotReady: t("virtual.stage.statusNotReady", "No one can join yet"),
    stateConnected: t("virtual.stage.stateConnected", "Connected"),
    stateLocalOnly: t("virtual.stage.stateLocalOnly", "Your devices only"),
    stateUnavailable: t("virtual.stage.stateUnavailable", "Room not available"),
    remoteWaiting: t("virtual.stage.remoteWaiting", "No one else is in this room yet."),
    remoteRepNoRoute: t("virtual.stage.remoteRepRoute", "The representative joins through their assigned authenticated session."),
    remoteUnavailable: t("virtual.stage.remoteUnavailable", "The video service is not configured in this environment."),
    remoteUnavailableReason: t("virtual.stage.remoteUnavailableReason", "Camera, microphone and screen sharing remain available for a local device check."),
    selfView: t("virtual.stage.selfView", "Your camera preview"),
    cameraOff: t("virtual.stage.cameraOff", "Camera off"),
    cameraOn: t("virtual.stage.cameraOn", "Camera on"),
    micOff: t("virtual.stage.micOff", "Microphone off"),
    micOn: t("virtual.stage.micOn", "Microphone on"),
    share: t("virtual.stage.share", "Share screen"),
    shareStop: t("virtual.stage.shareStop", "Stop sharing"),
    leave: t("virtual.stage.leave", "Leave room"),
    stopDevices: t("virtual.stage.stopDevices", "Turn off my devices"),
    sharingLabel: t("virtual.stage.sharingLabel", "Screen sharing"),
    note: t("virtual.stage.note", "Devices are released when you leave or close this page. Nothing here is a simulated call."),
    errDenied: t("virtual.stage.errDenied", "Camera or microphone permission was denied. Allow access in browser settings and retry."),
    errNotFound: t("virtual.stage.errNotFound", "No suitable camera or microphone was found."),
    errBusy: t("virtual.stage.errBusy", "The camera or microphone is in use by another application."),
    errUnsupported: t("virtual.stage.errUnsupported", "This browser does not support the requested media capability."),
    errGeneric: t("virtual.stage.errGeneric", "The device could not be opened. Check it and retry."),
    join: t("virtual.stage.join", "Join room"),
    joining: t("virtual.stage.joining", "Joining…"),
    stateNotJoined: t("virtual.stage.stateNotJoined", "Not connected"),
    joinedWith: t("virtual.stage.joinedWith", "Connected with {n} participant(s)"),
    joinedAlone: t("virtual.stage.joinedAlone", "Connected — waiting for participant"),
    errJoin: t("virtual.stage.errJoin", "The governed video room could not be joined. Retry, reschedule or escalate; there is no bypass."),
  };

  return (
    <>
      <FieldHeader
        leading={<Link href="/field/virtual" className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
        </Link>}
        title={tr("field.virtual.sessionTitle", "Remote inspection session", "جلسة تفتيش عن بُعد")}
        subtitle={<>{session.visits.factories?.name} · <span className="id-code"><bdi>{session.id.slice(0, 8)}</bdi></span></>}
        right={stateLabel ? <span className="badge badge-info">{locale === "ar" ? stateLabel.ar : stateLabel.en}</span> : null}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <VirtualSessionClient
        session={session}
        locale={locale === "ar" ? "ar" : "en"}
        transportConfigured={videoRoomJoinable()}
        stage={stage}
      />
    </>
  );
}
