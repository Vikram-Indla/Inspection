"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { beginRemote, joinParticipant, openWaitingRoom, type RoomActionResult } from "@/app/(app)/virtual/[id]/actions";
import RoomStage, { type RoomStageStrings } from "@/app/(app)/virtual/[id]/RoomStage";
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

export default function VirtualSessionClient({ session, locale, transportConfigured, stage }: { session: FieldVirtualSession; locale: "en" | "ar"; transportConfigured: boolean; stage: RoomStageStrings }) {
  const ar = locale === "ar";
  const tx = (en: string, arabic: string) => ar ? arabic : en;
  const router = useRouter();
  const sb = supabaseBrowser();
  const rev = `${session.state}:${session.timeline?.length ?? 0}`;
  const representatives = session.virtual_participants.filter(p => p.role === "factory_rep");
  const allVerified = representatives.length > 0 && representatives.every(p => !!p.verified_at);
  const [waitState, waitAction, waitPending] = useActionState<RoomActionResult, FormData>(openWaitingRoom, {});
  const [joinState, joinAction, joinPending] = useActionState<RoomActionResult, FormData>(joinParticipant, {});
  const [beginState, beginAction, beginPending] = useActionState<RoomActionResult, FormData>(beginRemote, {});
  const [otpMessage, setOtpMessage] = useState<Record<string, string>>({});
  const [otpCodes, setOtpCodes] = useState<Record<string, string>>({});
  const [otpBusy, setOtpBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [staleDismissed, setStaleDismissed] = useState(false);

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
  const remoteName = representatives[0]?.display_name ?? tx("Factory representative", "ممثل المنشأة");
  const remoteInitials = (remoteName.trim().split(/\s+/).map(word => word[0] ?? "").join("").slice(0, 2) || "—").toUpperCase();

  return (
    <>
      <main className={styles.wrap}>
        {closed && (
          <div className={styles.bannerDone} role="status">
            <strong>{tx("Session closed", "الجلسة مغلقة")}</strong>
            <span>{tx("Read-only — this session is closed and can no longer be changed. The saved close reason stays visible.", "للقراءة فقط — هذه الجلسة مغلقة ولا يمكن تعديلها بعد الآن. يبقى سبب الإغلاق المحفوظ ظاهراً.")}</span>
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

        <RoomStage
          strings={stage}
          sessionId={session.id}
          remoteName={remoteName}
          remoteInitials={remoteInitials}
          transportConfigured={transportConfigured && online && !closed}
        />
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
