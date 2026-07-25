"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { beginRemote, joinParticipant, openWaitingRoom, type RoomActionResult } from "@/app/(app)/virtual/[id]/actions";
import { selectVideoProvider, type VideoInspectionProvider, type VideoJoinResult } from "@/lib/providers/video";
import { supabaseBrowser } from "@/lib/supabase";
import styles from "../virtual.module.css";

type Participant = { id: string; display_name: string; role: string; joined_at: string | null; verified_at: string | null };
export type FieldVirtualSession = {
  id: string; state: string; appointment_at: string; timeline: unknown[] | null; visit_id: string;
  virtual_participants: Participant[];
  visits: {
    id: string;
    factories: { name: string; factory_code: string | null } | null;
    assignments: { inspector_id: string }[];
    package_versions: { version_label: string; packages: { code: string } | null } | null;
    inspections: { id: string; status: string } | null;
  } | null;
};

const ORDER = ["scheduled", "waiting", "joined", "verified", "in_progress", "closed"];

export default function VirtualSessionClient({ session, locale, userId }: { session: FieldVirtualSession; locale: "en" | "ar"; userId: string }) {
  const ar = locale === "ar";
  const tx = (en: string, arabic: string) => ar ? arabic : en;
  const router = useRouter();
  const sb = supabaseBrowser();
  const rev = `${session.state}:${session.timeline?.length ?? 0}`;
  const inspector = session.virtual_participants.find(p => p.role === "inspector");
  const representatives = session.virtual_participants.filter(p => p.role === "factory_rep");
  const allVerified = representatives.length > 0 && representatives.every(p => !!p.verified_at);
  const [waitState, waitAction, waitPending] = useActionState<RoomActionResult, FormData>(openWaitingRoom, {});
  const [joinState, joinAction, joinPending] = useActionState<RoomActionResult, FormData>(joinParticipant, {});
  const [beginState, beginAction, beginPending] = useActionState<RoomActionResult, FormData>(beginRemote, {});
  const [provider, setProvider] = useState<VideoInspectionProvider | null>(null);
  const [video, setVideo] = useState<VideoJoinResult | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [otpMessage, setOtpMessage] = useState<Record<string, string>>({});
  const [otpCodes, setOtpCodes] = useState<Record<string, string>>({});
  const [otpBusy, setOtpBusy] = useState(false);

  useEffect(() => {
    try { setProvider(selectVideoProvider()); } catch { setProvider(null); setVideoError(true); }
  }, []);
  useEffect(() => {
    if (waitState.ok || joinState.ok) router.refresh();
  }, [waitState.ok, joinState.ok, router]);

  async function connect() {
    if (!provider || connecting) return;
    setConnecting(true); setVideoError(false);
    try {
      const result = await provider.joinRoom(session.id, inspector?.id ?? userId);
      setVideo(result);
      if (result.state === "provider_unavailable") setVideoError(true);
    } catch { setVideo(null); setVideoError(true); }
    finally { setConnecting(false); }
  }

  async function endVideo() {
    if (!provider) return;
    try { await provider.endSession(session.id); } finally { setVideo(null); }
  }

  async function requestOtp(participant: Participant) {
    setOtpBusy(true);
    const { data, error } = await sb.rpc("vp_request_otp", { p_participant: participant.id });
    setOtpMessage(x => ({ ...x, [participant.id]: error ? tx("OTP service unavailable.", "خدمة رمز التحقق غير متاحة.") : tx("OTP sent through the configured identity service.", "أُرسل رمز التحقق عبر خدمة الهوية المهيأة.") }));
    if (data && typeof data === "object" && "dev_code" in data && typeof data.dev_code === "string")
      setOtpMessage(x => ({ ...x, [participant.id]: tx(`Development OTP: ${data.dev_code}`, `رمز التطوير: ${data.dev_code}`) }));
    setOtpBusy(false);
  }

  async function verifyOtp(participant: Participant) {
    const code = otpCodes[participant.id]?.trim();
    if (!code) return;
    setOtpBusy(true);
    const { data, error } = await sb.rpc("vp_verify_otp", { p_participant: participant.id, p_code: code });
    const verified = !error && !!(data && typeof data === "object" && "verified" in data && data.verified);
    setOtpMessage(x => ({ ...x, [participant.id]: verified ? tx("Identity verified.", "تم التحقق من الهوية.") : tx("Verification failed. No bypass was applied.", "فشل التحقق. لم يتم تطبيق أي تجاوز.") }));
    setOtpBusy(false);
    if (verified) router.refresh();
  }

  const actionState = beginState.error ?? joinState.error ?? waitState.error ?? beginState.ok ?? joinState.ok ?? waitState.ok;
  const current = ORDER.indexOf(session.state);
  const roomReady = session.state === "in_progress";

  return (
    <>
      <main className={styles.wrap}>
        {actionState && <div className={styles.alert} role="status">{actionState}</div>}
        <section className={styles.card}>
          <h2>{tx("Session state path", "مسار حالة الجلسة")}</h2>
          <div className={styles.path}>
            {ORDER.map((state, index) => <span key={state} className={`${styles.node} ${index < current ? styles.done : ""} ${index === current ? styles.now : ""}`}>
              <i />{tx(state.replaceAll("_", " "), state.replaceAll("_", " "))}
            </span>)}
          </div>
        </section>

        <section className={styles.card}>
          <h2>{tx("Readiness contract", "عقد الجاهزية")}</h2>
          <p className={styles.hint}>{tx("Stored facts resolve to one governed next action. Missing facts remain missing.", "تُفضي الحقائق المخزنة إلى إجراء تالٍ واحد محكوم. تبقى الحقائق الناقصة ناقصة.")}</p>
          <dl className={styles.facts}>
            <div><dt>{tx("Appointment", "الموعد")}</dt><dd><bdi>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.appointment_at))}</bdi></dd></div>
            <div><dt>{tx("Factory", "المنشأة")}</dt><dd>{session.visits?.factories?.name}</dd></div>
            <div><dt>{tx("Package", "الحزمة")}</dt><dd>{session.visits?.package_versions ? <><bdi>{session.visits.package_versions.packages?.code}</bdi> · {session.visits.package_versions.version_label}</> : tx("Unavailable", "غير متاحة")}</dd></div>
            <div><dt>{tx("Participants", "المشاركون")}</dt><dd>{representatives.length ? (allVerified ? tx("Verified", "تم التحقق") : tx("Verification pending", "التحقق قيد الانتظار")) : tx("Missing", "ناقص")}</dd></div>
          </dl>
        </section>

        <section className={styles.card}>
          <h2>{tx("Participants and identity", "المشاركون والهوية")}</h2>
          <p className={styles.hint}>{tx("Every factory representative must be OTP-verified. There is no bypass.", "يجب التحقق من كل ممثل للمنشأة عبر رمز التحقق. لا يوجد تجاوز.")}</p>
          {session.virtual_participants.length === 0 ? <div className={styles.alert}>{tx("No participants are recorded.", "لا يوجد مشاركون مسجلون.")}</div> :
            session.virtual_participants.map(p => <div className={styles.participant} key={p.id}>
              <div><strong>{p.display_name}</strong><span>{p.role === "inspector" ? tx("Inspector", "المفتش") : tx("Factory representative", "ممثل المنشأة")}</span></div>
              <span className={`badge ${p.verified_at ? "badge-compliant" : "badge-warning"}`}>{p.verified_at ? tx("Verified", "تم التحقق") : p.joined_at ? tx("Joined", "انضم") : tx("Not joined", "لم ينضم")}</span>
              {!p.joined_at && p.role === "inspector" && <form action={joinAction}>
                <input type="hidden" name="session_id" value={session.id} /><input type="hidden" name="participant_id" value={p.id} />
                <button className="btn btn-secondary" disabled={joinPending}>{tx("Join session", "الانضمام إلى الجلسة")}</button>
              </form>}
              {p.role === "factory_rep" && p.joined_at && !p.verified_at && <div className={styles.otp}>
                <button className="btn btn-secondary" type="button" disabled={otpBusy} onClick={() => requestOtp(p)}>{tx("Send OTP", "إرسال الرمز")}</button>
                <input value={otpCodes[p.id] ?? ""} onChange={e => setOtpCodes(x => ({ ...x, [p.id]: e.target.value }))} inputMode="numeric" maxLength={6} aria-label={tx("OTP code", "رمز التحقق")} />
                <button className="btn btn-primary" type="button" disabled={otpBusy || !otpCodes[p.id]} onClick={() => verifyOtp(p)}>{tx("Verify", "تحقق")}</button>
                {otpMessage[p.id] && <span role="status">{otpMessage[p.id]}</span>}
              </div>}
            </div>)}
        </section>

        <section className={styles.card}>
          <div className={styles.roomHead}><h2>{tx("Session room", "غرفة الجلسة")}</h2><span className="badge badge-outline">{tx("Fail closed", "إغلاق آمن")}</span></div>
          <div className={styles.room}>
            {video?.provider === "stub" ? <>
              <strong>{tx("SIMULATED VIDEO SESSION", "جلسة فيديو محاكاة")}</strong>
              <span>{tx(`State: ${video.state}`, `الحالة: ${video.state}`)}</span>
              <span>{tx("No real call is connected.", "لا توجد مكالمة حقيقية متصلة.")}</span>
            </> : <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 9 6-3v12l-6-3" /></svg>
              <strong>{tx("Video provider unavailable", "مزوّد الفيديو غير متاح")}</strong>
              <span>{tx("Teams, Zoom and premium Twilio are not configured provider facts.", "لم تتم تهيئة Teams أو Zoom أو Twilio المدفوع كحقائق للمزوّد.")}</span>
            </>}
          </div>
          {videoError && <div className={styles.alert} role="alert">{tx("The provider could not connect. Retry, reschedule or escalate; the session was not advanced.", "تعذر اتصال المزوّد. أعد المحاولة أو الجدولة أو صعّد؛ لم تتقدم حالة الجلسة.")}</div>}
          <div className={styles.actions}>
            {provider && !video && <button className="btn btn-primary" onClick={connect} disabled={connecting || !roomReady}>{connecting ? tx("Connecting…", "جارٍ الاتصال…") : tx("Open simulated provider", "فتح المزوّد المحاكى")}</button>}
            {video && <button className="btn btn-secondary" onClick={endVideo}>{tx("End provider session", "إنهاء جلسة المزوّد")}</button>}
          </div>
        </section>
      </main>

      <footer className={styles.sticky}>
        <span className={`badge ${allVerified ? "badge-completed" : "badge-warning"}`}>{allVerified ? tx("Identity ready", "الهوية جاهزة") : tx("Verification required", "التحقق مطلوب")}</span>
        {session.state === "scheduled" ? <form action={waitAction}><input type="hidden" name="session_id" value={session.id} /><button className="btn btn-primary" disabled={waitPending}>{tx("Open waiting room", "فتح غرفة الانتظار")}</button></form> :
          session.state === "verified" || session.state === "in_progress" ? <form action={beginAction}><input type="hidden" name="session_id" value={session.id} /><input type="hidden" name="rev" value={rev} /><button className="btn btn-primary" disabled={beginPending || !allVerified}>{session.state === "in_progress" ? tx("Continue inspection", "متابعة التفتيش") : tx("Begin remote inspection", "بدء التفتيش عن بُعد")}</button></form> :
          <button className="btn btn-primary" disabled>{tx("Verify participants first", "تحقق من المشاركين أولاً")}</button>}
      </footer>
    </>
  );
}
