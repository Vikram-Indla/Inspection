"use client";

import { useEffect, useState } from "react";
import { getFieldDeviceIdentifier } from "@/lib/field-device";
import {
  readFieldDeviceEnrollment,
  selfEnrollFieldDevice,
  type FieldDeviceEnrollmentResult,
} from "../actions";

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

// Split out of FieldSettingsClient.tsx (SAQEEL correction backlog Step 5) —
// identical logic, moved to its own route per the handoff spec's "Trusted
// Devices" dedicated screen. Settings keeps a link here instead of inlining
// this section.
export default function TrustedDevicesClient({ locale }: { locale: Locale }) {
  const [deviceIdentifier, setDeviceIdentifier] = useState("");
  const [enrollment, setEnrollment] = useState<FieldDeviceEnrollmentResult | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const identifier = getFieldDeviceIdentifier();
    setDeviceIdentifier(identifier);
    void readFieldDeviceEnrollment(identifier).then(setEnrollment);
  }, []);

  async function enroll() {
    if (!deviceIdentifier || enrolling) return;
    setEnrolling(true);
    try {
      setEnrollment(await selfEnrollFieldDevice(deviceIdentifier));
    } finally {
      setEnrolling(false);
    }
  }

  const canEnroll = enrollment?.kind === "not_enrolled";

  return (
    <div className="ax-field-page">
      <section className="ax-surface ax-panel stack" aria-labelledby="field-devices-heading">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <h3 id="field-devices-heading">{copy(locale, "Trusted devices", "الأجهزة الموثوقة")}</h3>
            <p className="ax-caption">{copy(locale, "Trust is granted only by the backend approval process.", "تُمنح الثقة فقط من خلال عملية الموافقة في الخادم.")}</p>
          </div>
          <span className={`ax-lozenge ${enrollment && (enrollment.kind === "enrolled" || enrollment.kind === "already_registered") && enrollment.trustStatus === "trusted" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>
            {trustLabel(enrollment, locale)}
          </span>
        </div>
        <div className="ax-banner" role="status" data-enrollment-state={enrollment?.kind ?? "checking"}>
          <strong>{trustLabel(enrollment, locale)}</strong> {trustDetail(enrollment, locale)}
        </div>
        <dl style={{ margin: 0 }}>
          <dt className="ax-caption">{copy(locale, "Local device identifier", "معرّف الجهاز المحلي")}</dt>
          <dd style={{ margin: 0, overflowWrap: "anywhere" }}><bdi>{deviceIdentifier || copy(locale, "Loading…", "جارٍ التحميل…")}</bdi></dd>
        </dl>
        {canEnroll ? (
          <div>
            <button type="button" className="ax-btn ax-btn--prominent ax-btn--field" onClick={() => void enroll()} disabled={enrolling}>
              {enrolling ? copy(locale, "Requesting enrollment…", "جارٍ طلب التسجيل…") : copy(locale, "Request device approval", "طلب الموافقة على الجهاز")}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
