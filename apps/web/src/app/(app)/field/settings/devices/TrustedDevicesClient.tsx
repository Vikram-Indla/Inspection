"use client";

import { useEffect, useState } from "react";
import { getFieldDeviceIdentifier } from "@/lib/field-device";
import {
  readFieldDeviceEnrollment,
  selfEnrollFieldDevice,
  type FieldDeviceEnrollmentResult,
} from "../actions";
import {
  clearBiometricUnlock,
  enrollBiometricUnlock,
  platformAuthenticatorAvailable,
  readBiometricUnlock,
  type BiometricUnlockRecord,
} from "@/lib/field-biometric-unlock";
import styles from "./devices.module.css";

type Locale = "en" | "ar";

function copy(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

function trustLabel(result: FieldDeviceEnrollmentResult | null, locale: Locale): string {
  if (!result) return copy(locale, "Checking enrollment…", "جارٍ التحقق من التسجيل…");
  if (result.kind === "not_enrolled") return copy(locale, "Not enrolled", "غير مسجل");
  if (result.kind === "identifier_collision") return copy(locale, "Identifier already registered", "معرّف الجهاز مسجل مسبقاً");
  if (result.kind === "signed_out") return copy(locale, "Session expired", "انتهت صلاحية الجلسة");
  if (result.kind === "invalid_identifier") return copy(locale, "Device identifier unavailable", "معرّف الجهاز غير متاح");
  if (result.kind === "unavailable") return copy(locale, "Enrollment status unavailable", "حالة التسجيل غير متاحة");
  if (result.kind === "policy_pending") return copy(locale, "Self-enrollment not yet enabled", "التسجيل الذاتي غير مفعّل بعد");
  if (!("trustStatus" in result)) return copy(locale, "Enrollment status unavailable", "حالة التسجيل غير متاحة");
  if (result.trustStatus === "pending") return copy(locale, "Pending approval", "بانتظار الموافقة");
  if (result.trustStatus === "trusted") return copy(locale, "Trusted", "موثوق");
  return result.trustStatus.replaceAll("_", " ");
}

function trustDetail(result: FieldDeviceEnrollmentResult | null, locale: Locale): string {
  if (!result) return copy(locale, "Reading the RLS-scoped device register.", "جارٍ قراءة سجل الأجهزة ضمن نطاق سياسة الوصول.");
  if (result.kind === "not_enrolled") {
    return copy(locale, "Enroll this iPad to request approval. Enrollment does not grant trust.", "سجّل هذا الآيباد لطلب الموافقة. التسجيل لا يمنح الثقة.");
  }
  if (result.kind === "identifier_collision") {
    return copy(locale, "This identifier belongs to an existing record that is not visible in your account. Nothing was overwritten.", "هذا المعرّف مرتبط بسجل موجود غير ظاهر في حسابك. لم تتم الكتابة فوق أي بيانات.");
  }
  if (result.kind === "signed_out") return copy(locale, "Sign in again before checking or enrolling this device.", "سجّل الدخول مجدداً قبل التحقق من الجهاز أو تسجيله.");
  if (result.kind === "invalid_identifier") return copy(locale, "A stable field-device UUID could not be verified.", "تعذر التحقق من المعرّف الثابت لجهاز الميدان.");
  if (result.kind === "unavailable") return copy(locale, "The device register could not be read. No trust is inferred.", "تعذرت قراءة سجل الأجهزة. لا يتم استنتاج الثقة.");
  if (result.kind === "policy_pending") return copy(locale, "Self-enrollment is not yet enabled in this environment. This is expected until the approval policy is deployed — no trust is inferred.", "التسجيل الذاتي غير مفعّل بعد في هذه البيئة. هذا متوقّع حتى يتم نشر سياسة الموافقة — لا يتم استنتاج الثقة.");
  if (!("trustStatus" in result)) return copy(locale, "The device register could not be read. No trust is inferred.", "تعذرت قراءة سجل الأجهزة. لا يتم استنتاج الثقة.");
  if (result.trustStatus === "pending") {
    return result.kind === "already_registered"
      ? copy(locale, "Already registered. Pending approval — this device is not trusted yet. Nothing was overwritten.", "مسجل مسبقاً. بانتظار الموافقة — هذا الجهاز غير موثوق حتى الآن. لم تتم الكتابة فوق أي بيانات.")
      : copy(locale, "Pending approval — this device is not trusted yet.", "بانتظار الموافقة — هذا الجهاز غير موثوق حتى الآن.");
  }
  if (result.trustStatus === "trusted") {
    return result.kind === "already_registered"
      ? copy(locale, "Already registered. The backend device register currently grants trusted status. Nothing was overwritten.", "مسجل مسبقاً. يمنح سجل الأجهزة في الخادم حالياً حالة موثوق. لم تتم الكتابة فوق أي بيانات.")
      : copy(locale, "The backend device register currently grants trusted status.", "يمنح سجل الأجهزة في الخادم حالياً حالة موثوق.");
  }
  return copy(locale, "The backend device register does not currently grant trusted access.", "لا يمنح سجل الأجهزة في الخادم حالياً وصولاً موثوقاً.");
}

// SAQEEL correction backlog Step 5 — the Trusted Devices section lives on its own
// route. Chrome converted to the SAQEEL DS (SAQEEL Field Trusted Devices.dc.html):
// a device card for the ONE real, RLS-scoped device register row, an enroll
// action, and a governed security note. Trust is never inferred client-side — it
// is whatever the backend register reports.
export default function TrustedDevicesClient({
  locale,
  userId,
  userLabel,
}: {
  locale: Locale;
  userId: string;
  userLabel: string;
}) {
  const [deviceIdentifier, setDeviceIdentifier] = useState("");
  const [enrollment, setEnrollment] = useState<FieldDeviceEnrollmentResult | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Biometric unlock is a LOCAL opt-in layered on top of backend device trust
  // — see lib/field-biometric-unlock.ts. It is only ever offered once the
  // backend register (below) reports this exact device as trusted; there is
  // no path to it from an unenrolled or pending device.
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioRecord, setBioRecord] = useState<BiometricUnlockRecord | null>(null);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  useEffect(() => {
    const identifier = getFieldDeviceIdentifier();
    setDeviceIdentifier(identifier);
    void readFieldDeviceEnrollment(identifier).then(setEnrollment);
    setBioRecord(readBiometricUnlock(userId));
    void platformAuthenticatorAvailable().then(setBioAvailable);
  }, [userId]);

  async function enroll() {
    if (!deviceIdentifier || enrolling) return;
    setEnrolling(true);
    try {
      setEnrollment(await selfEnrollFieldDevice(deviceIdentifier));
    } finally {
      setEnrolling(false);
    }
  }

  const registered = enrollment && (enrollment.kind === "enrolled" || enrollment.kind === "already_registered");
  const trusted = registered && enrollment.trustStatus === "trusted";
  const canEnroll = enrollment?.kind === "not_enrolled";

  async function enrollBiometric() {
    if (bioBusy) return;
    setBioBusy(true);
    setBioError(null);
    try {
      setBioRecord(await enrollBiometricUnlock(userId, userLabel));
    } catch {
      setBioError(
        copy(
          locale,
          "Could not set up Face ID on this device. Your device may not support it, or the prompt was cancelled.",
          "تعذّر إعداد التعرّف على الوجه على هذا الجهاز. قد لا يدعمه جهازك، أو تم إلغاء الطلب.",
        ),
      );
    } finally {
      setBioBusy(false);
    }
  }

  function disableBiometric() {
    clearBiometricUnlock(userId);
    setBioRecord(null);
    setBioError(null);
  }

  const fmt = (value: string | null): string => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(d);
  };

  return (
    <div className={styles.wrap}>
      <p className={`t-caption ${styles.intro}`}>
        {copy(locale, "Devices authorized to unlock the field app. Trust is granted only by the backend approval process — enrollment alone does not grant it.", "الأجهزة المصرّح لها بفتح التطبيق الميداني. تُمنح الثقة فقط من خلال عملية الموافقة في الخادم — التسجيل وحده لا يمنحها.")}
      </p>

      {/* The real device register row for THIS device — rendered only when the
          backend actually has an enrollment; otherwise an honest status card. */}
      {registered ? (
        <div className={styles.card} data-enrollment-state={enrollment.kind}>
          <span className={styles.icn} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 22, height: 22 }}>
              <rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" />
            </svg>
          </span>
          <div className={styles.body}>
            <div className={styles.name}>
              <span className={styles.nameText}>{copy(locale, "This device", "هذا الجهاز")}</span>
              <span className="badge" style={{ background: "var(--status-compliant-soft)", color: "var(--status-compliant-text)", height: 18 }}>{copy(locale, "This device", "هذا الجهاز")}</span>
              <span className={`badge ${trusted ? "badge-compliant" : "badge-warning"}`}>{trustLabel(enrollment, locale)}</span>
            </div>
            <div className={`t-caption id-code ${styles.id}`}><bdi>{deviceIdentifier}</bdi></div>
            <div className={`t-caption ${styles.meta}`}>{copy(locale, "Last seen", "آخر ظهور")}: {fmt(enrollment.lastSeenAt)}</div>
            <div className="t-caption">{copy(locale, "Enrolled", "تاريخ التسجيل")}: {fmt(enrollment.enrolledAt)}</div>
            <p className="t-caption" style={{ marginBlockStart: 8, marginBlockEnd: 0 }}>{trustDetail(enrollment, locale)}</p>
          </div>
        </div>
      ) : (
        <div className={styles.card} data-enrollment-state={enrollment?.kind ?? "checking"}>
          <span className={styles.icn} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 22, height: 22 }}>
              <rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" />
            </svg>
          </span>
          <div className={styles.body}>
            <div className={styles.name}>
              <span className={styles.nameText}>{copy(locale, "This device", "هذا الجهاز")}</span>
              <span className="badge badge-warning">{trustLabel(enrollment, locale)}</span>
            </div>
            <div className={`t-caption id-code ${styles.id}`}><bdi>{deviceIdentifier || copy(locale, "Loading…", "جارٍ التحميل…")}</bdi></div>
            <p className="t-caption" style={{ marginBlockStart: 8, marginBlockEnd: 0 }}>{trustDetail(enrollment, locale)}</p>
          </div>
        </div>
      )}

      {canEnroll && (
        <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => void enroll()} disabled={enrolling}>
          {enrolling ? copy(locale, "Requesting enrollment…", "جارٍ طلب التسجيل…") : copy(locale, "Enroll this device", "تسجيل هذا الجهاز")}
        </button>
      )}

      {/* Face ID unlock opt-in. Only offered once the backend register above
          reports THIS device as trusted — an unenrolled or pending device
          never sees this section, matching the mental model: trust the
          device first (Operations approval), then biometric can be enabled. */}
      {trusted && (
        <div className={styles.card}>
          <span className={styles.icn} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 22, height: 22 }}>
              <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
              <path d="M9 10h.01M15 10h.01M9.5 15c.9.7 4.1.7 5 0" />
            </svg>
          </span>
          <div className={styles.body}>
            <div className={styles.name}>
              <span className={styles.nameText}>{copy(locale, "Face ID unlock", "فتح بالتعرف على الوجه")}</span>
              <span className={`badge ${bioRecord ? "badge-compliant" : "badge-warning"}`}>
                {bioRecord ? copy(locale, "On", "مُفعّل") : copy(locale, "Off", "غير مُفعّل")}
              </span>
            </div>
            <p className="t-caption" style={{ marginBlockStart: 8, marginBlockEnd: 0 }}>
              {bioRecord
                ? copy(
                    locale,
                    "This browser can unlock your already-signed-in session with Face ID instead of retyping your password. Your biometric data never leaves this device.",
                    "يمكن لهذا المتصفح فتح جلستك المسجّلة مسبقاً بالتعرف على الوجه بدلاً من إعادة كتابة كلمة المرور. لا تغادر بياناتك الحيوية هذا الجهاز أبداً.",
                  )
                : bioAvailable
                  ? copy(
                      locale,
                      "This device supports Face ID / Touch ID. Turning it on lets you unlock the field app without retyping your password on this trusted device.",
                      "يدعم هذا الجهاز التعرّف على الوجه / بصمة الإصبع. تفعيله يتيح فتح التطبيق الميداني دون إعادة كتابة كلمة المرور على هذا الجهاز الموثوق.",
                    )
                  : copy(
                      locale,
                      "This device does not report a platform authenticator (Face ID / Touch ID), so this cannot be enabled here.",
                      "هذا الجهاز لا يُبلغ عن مُصادِق مدمج (تعرّف على الوجه / بصمة إصبع)، لذا لا يمكن تفعيله من هنا.",
                    )}
            </p>
            {bioError && (
              <p className="t-caption" style={{ marginBlockStart: 8, marginBlockEnd: 0, color: "var(--status-warning-text)" }} role="alert">
                {bioError}
              </p>
            )}
            <div style={{ marginBlockStart: 12 }}>
              {bioRecord ? (
                <button type="button" className="btn btn-ghost" onClick={disableBiometric}>
                  {copy(locale, "Turn off Face ID unlock", "إيقاف الفتح بالتعرف على الوجه")}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void enrollBiometric()}
                  disabled={bioBusy || !bioAvailable}
                >
                  {bioBusy
                    ? copy(locale, "Setting up…", "جارٍ الإعداد…")
                    : copy(locale, "Enable Face ID unlock", "تفعيل الفتح بالتعرف على الوجه")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`panel ${styles.hint}`}>
        <svg className={styles.hintIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
        </svg>
        <span>{copy(locale, "The local device identifier is generated on-device. Trust and revocation are controlled by the backend device register, not by this screen.", "يُنشأ معرّف الجهاز المحلي على الجهاز. تُدار الثقة والإلغاء عبر سجل الأجهزة في الخادم، وليس من هذه الشاشة.")}</span>
      </div>
    </div>
  );
}
