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
  // Three honest provider conditions. "resolving" is the pre-effect state and
  // must never render a join affordance; "not_configured" is the fail-closed
  // default (no NEXT_PUBLIC_FEATURE_VIDEO_PROVIDER opt-in, so selectVideoProvider
  // returns null); "configured" only ever means the staging STUB today — there is
  // no real vendor adapter, so it stays labelled SIMULATED at every step.
  type ProviderStatus = "resolving" | "not_configured" | "configured";
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("resolving");
  const [provider, setProvider] = useState<VideoInspectionProvider | null>(null);
  const [video, setVideo] = useState<VideoJoinResult | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [otpMessage, setOtpMessage] = useState<Record<string, string>>({});
  const [otpCodes, setOtpCodes] = useState<Record<string, string>>({});
  const [otpBusy, setOtpBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [staleDismissed, setStaleDismissed] = useState(false);

  useEffect(() => {
    try {
      const selected = selectVideoProvider();
      setProvider(selected);
      setProviderStatus(selected ? "configured" : "not_configured");
    } catch {
      // A throwing adapter is still an unconfigured provider — never a joinable one.
      setProvider(null);
      setProviderStatus("not_configured");
    }
  }, []);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  useEffect(() => {
    if (waitState.ok || joinState.ok) router.refresh();
  }, [waitState.ok, joinState.ok, router]);

  async function connect() {
    if (!provider || connecting) return;
    setConnecting(true); setVideoError(null);
    try {
      const result = await provider.joinRoom(session.id, inspector?.id ?? userId);
      // provider_unavailable is a failure, not a session. Keep it out of `video`
      // so the room can never paint a "simulated session" over a dead room.
      if (result.state === "provider_unavailable") {
        setVideo(null);
        setVideoError(tx(
          "The simulated provider reported the room unavailable. Nothing was connected and the session state was not advanced.",
          "أبلغ المزوّد المحاكى أن الغرفة غير متاحة. لم يتم أي اتصال ولم تتقدم حالة الجلسة.",
        ));
      } else {
        setVideo(result);
      }
    } catch {
      setVideo(null);
      setVideoError(tx(
        "The provider adapter threw while connecting. Nothing was connected and the session state was not advanced.",
        "أخفق محوّل المزوّد أثناء الاتصال. لم يتم أي اتصال ولم تتقدم حالة الجلسة.",
      ));
    }
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
  const closed = session.state === "closed";
  // S13 concurrent-change: the server guards already return `stale` when the
  // submitted rev no longer matches state:timelineLength. Surface it as its own
  // banner — a stale write was REFUSED, so the rendered state is not the truth.
  const stale = !staleDismissed && (beginState.stale || joinState.stale || waitState.stale) === true;
  const appointment = Date.parse(session.appointment_at);
  const appointmentLabel = Number.isNaN(appointment)
    ? null
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment));
  const partial = !session.visits?.factories || !session.visits?.package_versions;

  return (
    <>
      <main className={styles.wrap}>
        {closed && (
          <div className={styles.bannerDone} role="status">
            <strong>{tx("Session closed", "الجلسة مغلقة")}</strong>
            <span>{tx("Read-only — a closed session is immutable. The stored close reason is preserved.", "للقراءة فقط — الجلسة المغلقة غير قابلة للتعديل. يُحفظ سبب الإغلاق المخزن.")}</span>
          </div>
        )}
        {!online && (
          <div className={styles.alert} role="status">
            <strong>{tx("Offline", "غير متصل")}</strong>{" "}
            {tx("Mutating actions are disabled and nothing is queued. A remote session cannot be advanced offline.", "الإجراءات المُغيِّرة معطّلة ولا شيء في قائمة الانتظار. لا يمكن تقديم جلسة عن بُعد دون اتصال.")}
          </div>
        )}
        {stale && (
          <div className={styles.alert} role="alert">
            <strong>{tx("Concurrent change", "تغيّر متزامن")}</strong>{" "}
            {tx("The guard refused the write because this session changed since it was loaded. Reload to see the true state, then act.", "رفض الحارس الكتابة لأن هذه الجلسة تغيّرت منذ تحميلها. أعد التحميل لعرض الحالة الحقيقية ثم تصرّف.")}
            <button className="btn btn-secondary" type="button" onClick={() => { setStaleDismissed(true); router.refresh(); }}>
              {tx("Reload", "إعادة تحميل")}
            </button>
          </div>
        )}
        {actionState && <div className={styles.alert} role="status">
          {beginState.error || joinState.error || waitState.error
            ? tx("The requested change was not applied. Reload the session before trying again.", "لم يُطبّق التغيير المطلوب. أعد تحميل الجلسة قبل المحاولة مرة أخرى.")
            : tx("The session was updated.", "تم تحديث الجلسة.")}
        </div>}
        {partial && (
          <div className={styles.alert} role="status">
            {tx("Some linked visit details are unavailable. Missing values are left blank.", "بعض تفاصيل الزيارة المرتبطة غير متاحة. تُترك القيم الناقصة فارغة.")}
          </div>
        )}
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
            <div><dt>{tx("Appointment", "الموعد")}</dt><dd><bdi>{appointmentLabel}</bdi></dd></div>
            <div><dt>{tx("Factory", "المنشأة")}</dt><dd>{session.visits?.factories?.name ?? null}</dd></div>
            <div><dt>{tx("Package", "الحزمة")}</dt><dd>{session.visits?.package_versions ? <>{session.visits.package_versions.packages?.code ? <bdi>{session.visits.package_versions.packages.code}</bdi> : null}{session.visits.package_versions.packages?.code && session.visits.package_versions.version_label ? " · " : null}{session.visits.package_versions.version_label ?? null}</> : null}</dd></div>
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
                <button className="btn btn-secondary" disabled={joinPending || !online || closed}>{tx("Join session", "الانضمام إلى الجلسة")}</button>
              </form>}
              {p.role === "factory_rep" && p.joined_at && !p.verified_at && <div className={styles.otp}>
                <button className="btn btn-secondary" type="button" disabled={otpBusy || !online || closed} onClick={() => requestOtp(p)}>{tx("Send OTP", "إرسال الرمز")}</button>
                <input value={otpCodes[p.id] ?? ""} disabled={!online || closed} onChange={e => setOtpCodes(x => ({ ...x, [p.id]: e.target.value }))} inputMode="numeric" maxLength={6} aria-label={tx("OTP code", "رمز التحقق")} />
                <button className="btn btn-primary" type="button" disabled={otpBusy || !otpCodes[p.id] || !online || closed} onClick={() => verifyOtp(p)}>{tx("Verify", "تحقق")}</button>
                {otpMessage[p.id] && <span role="status">{otpMessage[p.id]}</span>}
              </div>}
            </div>)}
        </section>

        <section className={styles.card}>
          <div className={styles.roomHead}>
            <h2>{tx("Session room", "غرفة الجلسة")}</h2>
            {providerStatus === "configured"
              ? <span className="badge badge-warning">{tx("Simulated", "محاكاة")}</span>
              : <span className="badge badge-outline">{tx("Fail closed", "إغلاق آمن")}</span>}
          </div>
          <div className={styles.room}>
            {providerStatus === "resolving" ? (
              <span>{tx("Checking provider configuration…", "جارٍ التحقق من تهيئة المزوّد…")}</span>
            ) : providerStatus === "not_configured" ? (
              // FAIL CLOSED. No join affordance is rendered at all — a button that
              // "connects" to nothing would be a lie about a governed capability.
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 9 6-3v12l-6-3" /><path d="m3 3 18 18" /></svg>
                <strong>{tx("No video provider is configured", "لم تتم تهيئة أي مزوّد فيديو")}</strong>
                <span>{tx("Reason: no provider adapter is enabled for this environment, so no call surface exists and none is offered.", "السبب: لا يوجد محوّل مزوّد مُفعّل في هذه البيئة، لذا لا توجد واجهة اتصال ولا تُعرض أي واجهة.")}</span>
                <span>{tx("No provider name, service level or retention policy is assumed.", "لا يُفترض اسم مزوّد أو مستوى خدمة أو سياسة احتفاظ.")}</span>
              </>
            ) : video ? (
              <>
                <strong>{tx("SIMULATED VIDEO SESSION", "جلسة فيديو محاكاة")}</strong>
                <span><bdi>{tx(`State: ${video.state}`, `الحالة: ${video.state}`)}</bdi></span>
                <span><bdi>{tx(`Camera: ${video.camera} · Mic: ${video.mic}`, `الكاميرا: ${video.camera} · الميكروفون: ${video.mic}`)}</bdi></span>
                <span>{tx("No real call is connected. This is a staging stub, not a provider.", "لا توجد مكالمة حقيقية متصلة. هذه وحدة محاكاة للتجهيز وليست مزوّدًا.")}</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 9 6-3v12l-6-3" /></svg>
                <strong>{tx("Simulated provider is enabled", "المزوّد المحاكى مُفعّل")}</strong>
                <span>{tx("Opening it produces a staging stub only. It is never a real call and no real participant is reached.", "فتحه يُنتج وحدة محاكاة للتجهيز فقط. ليست مكالمة حقيقية ولا يتم الوصول إلى أي مشارك حقيقي.")}</span>
              </>
            )}
          </div>
          {videoError && <div className={styles.alert} role="alert">
            {videoError}{" "}
            {tx("Retry, reschedule or escalate — there is no bypass.", "أعد المحاولة أو الجدولة أو صعّد — لا يوجد تجاوز.")}
          </div>}
          {providerStatus === "not_configured" && (
            <p className={styles.hint}>
              {tx("Fallback: convert to a physical visit, reschedule, or escalate. The session cannot be advanced without a governed provider.", "البديل: التحويل إلى زيارة ميدانية أو إعادة الجدولة أو التصعيد. لا يمكن تقديم الجلسة دون مزوّد محكوم.")}
            </p>
          )}
          <div className={styles.actions}>
            {providerStatus === "configured" && !video && <button className="btn btn-primary" onClick={connect} disabled={connecting || !roomReady || !online || closed}>{connecting ? tx("Connecting…", "جارٍ الاتصال…") : tx("Open simulated provider", "فتح المزوّد المحاكى")}</button>}
            {video && <button className="btn btn-secondary" onClick={endVideo}>{tx("End provider session", "إنهاء جلسة المزوّد")}</button>}
          </div>
        </section>
      </main>

      <footer className={styles.sticky}>
        <span className={`badge ${closed ? "badge-outline" : allVerified ? "badge-completed" : "badge-warning"}`}>
          {closed ? tx("Closed", "مغلقة") : allVerified ? tx("Identity ready", "الهوية جاهزة") : tx("Verification required", "التحقق مطلوب")}
        </span>
        {closed ? <button className="btn btn-primary" disabled>{tx("Session closed", "الجلسة مغلقة")}</button> :
          session.state === "scheduled" ? <form action={waitAction}><input type="hidden" name="session_id" value={session.id} /><input type="hidden" name="rev" value={rev} /><button className="btn btn-primary" disabled={waitPending || !online}>{tx("Open waiting room", "فتح غرفة الانتظار")}</button></form> :
          session.state === "verified" || session.state === "in_progress" ? <form action={beginAction}><input type="hidden" name="session_id" value={session.id} /><input type="hidden" name="rev" value={rev} /><button className="btn btn-primary" disabled={beginPending || !allVerified || !online}>{session.state === "in_progress" ? tx("Continue inspection", "متابعة التفتيش") : tx("Begin remote inspection", "بدء التفتيش عن بُعد")}</button></form> :
          <button className="btn btn-primary" disabled>{tx("Verify participants first", "تحقق من المشاركين أولاً")}</button>}
      </footer>
    </>
  );
}
