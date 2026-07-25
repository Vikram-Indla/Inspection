import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import TrustedDevicesClient from "./TrustedDevicesClient";
import type { TrustedDevicesStrings } from "./strings";

// SAQEEL PWA-Field Trusted Devices.dc.html — dedicated field Trusted Devices
// screen. Chrome ported pixel-to-pixel from the design (back-arrow header, no
// bottom nav, device card, enroll action, security note).
//
// Two deliberate, governed departures from the design mock:
//   1. The mock lists two fabricated iPads with a per-device Revoke. The app
//      renders ONLY the real, RLS-scoped `mvp3_devices` row for this user and
//      offers no Revoke, because revocation exists solely as an Operations
//      command (`mvp3_issue_device_command`) that this surface cannot call. A
//      Revoke button here would be a control with nothing behind it.
//   2. The mock's "Enroll new device" links to the Biometric screen as though
//      biometric enrolment were a sign-in factor. It is not — see the scope
//      note rendered inside the biometric card and the comment block in
//      TrustedDevicesClient.
export default async function FieldTrustedDevicesPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) redirect("/login");
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));

  const strings: TrustedDevicesStrings = {
    intro: tr(
      "field.devices.intro",
      "Devices authorized to unlock the field app. Trust is granted only by the backend approval process — enrollment alone does not grant it.",
      "الأجهزة المصرّح لها بفتح التطبيق الميداني. تُمنح الثقة فقط من خلال عملية الموافقة في الخادم — التسجيل وحده لا يمنحها.",
    ),
    loading: tr("common.loading", "Loading…", "جارٍ التحميل…"),
    thisDevice: tr("field.devices.thisDevice", "This device", "هذا الجهاز"),
    lastAuth: tr("field.devices.lastAuth", "Last seen", "آخر ظهور"),
    enrolled: tr("field.devices.enrolledOn", "Enrolled", "تاريخ التسجيل"),

    stChecking: tr("field.devices.st.checking", "Checking enrollment…", "جارٍ التحقق من التسجيل…"),
    stNotEnrolled: tr("field.devices.st.notEnrolled", "Not enrolled", "غير مسجل"),
    stCollision: tr("field.devices.st.collision", "Identifier already registered", "معرّف الجهاز مسجل مسبقاً"),
    stSignedOut: tr("field.devices.st.signedOut", "Session expired", "انتهت صلاحية الجلسة"),
    stInvalidId: tr("field.devices.st.invalidId", "Device identifier unavailable", "معرّف الجهاز غير متاح"),
    stUnavailable: tr("field.devices.st.unavailable", "Enrollment status unavailable", "حالة التسجيل غير متاحة"),
    stPolicyPending: tr("field.devices.st.policyPending", "Self-enrollment not yet enabled", "التسجيل الذاتي غير مفعّل بعد"),
    stPending: tr("field.devices.st.pending", "Pending approval", "بانتظار الموافقة"),
    stTrusted: tr("field.devices.st.trusted", "Trusted", "موثوق"),
    stSuspended: tr("field.devices.st.suspended", "Suspended", "موقوف"),
    stRevoked: tr("field.devices.st.revoked", "Revoked", "ملغى"),
    stWipePending: tr("field.devices.st.wipePending", "Wipe pending", "بانتظار المسح"),
    stWiped: tr("field.devices.st.wiped", "Wiped", "تم المسح"),

    dtChecking: tr(
      "field.devices.dt.checking",
      "Reading the RLS-scoped device register.",
      "جارٍ قراءة سجل الأجهزة ضمن نطاق سياسة الوصول.",
    ),
    dtNotEnrolled: tr(
      "field.devices.dt.notEnrolled",
      "Enroll this iPad to request approval. Enrollment does not grant trust.",
      "سجّل هذا الآيباد لطلب الموافقة. التسجيل لا يمنح الثقة.",
    ),
    dtCollision: tr(
      "field.devices.dt.collision",
      "This identifier belongs to an existing record that is not visible in your account. Nothing was overwritten.",
      "هذا المعرّف مرتبط بسجل موجود غير ظاهر في حسابك. لم تتم الكتابة فوق أي بيانات.",
    ),
    dtSignedOut: tr(
      "field.devices.dt.signedOut",
      "Sign in again before checking or enrolling this device.",
      "سجّل الدخول مجدداً قبل التحقق من الجهاز أو تسجيله.",
    ),
    dtInvalidId: tr(
      "field.devices.dt.invalidId",
      "A stable field-device identifier could not be verified.",
      "تعذر التحقق من المعرّف الثابت لجهاز الميدان.",
    ),
    dtUnavailable: tr(
      "field.devices.dt.unavailable",
      "The device register could not be read. No trust is inferred.",
      "تعذرت قراءة سجل الأجهزة. لا يتم استنتاج الثقة.",
    ),
    dtPolicyPending: tr(
      "field.devices.dt.policyPending",
      "Self-enrollment is not enabled in this environment, so this device cannot be enrolled from here. Enrollment currently requires Operations. No trust is inferred.",
      "التسجيل الذاتي غير مفعّل في هذه البيئة، لذا لا يمكن تسجيل هذا الجهاز من هنا. يتطلب التسجيل حالياً تدخّل قسم العمليات. لا يتم استنتاج الثقة.",
    ),
    dtPending: tr(
      "field.devices.dt.pending",
      "Pending approval — this device is not trusted yet.",
      "بانتظار الموافقة — هذا الجهاز غير موثوق حتى الآن.",
    ),
    dtPendingRegistered: tr(
      "field.devices.dt.pendingRegistered",
      "Already registered. Pending approval — this device is not trusted yet. Nothing was overwritten.",
      "مسجل مسبقاً. بانتظار الموافقة — هذا الجهاز غير موثوق حتى الآن. لم تتم الكتابة فوق أي بيانات.",
    ),
    dtTrusted: tr(
      "field.devices.dt.trusted",
      "The backend device register currently grants trusted status.",
      "يمنح سجل الأجهزة في الخادم حالياً حالة موثوق.",
    ),
    dtTrustedRegistered: tr(
      "field.devices.dt.trustedRegistered",
      "Already registered. The backend device register currently grants trusted status. Nothing was overwritten.",
      "مسجل مسبقاً. يمنح سجل الأجهزة في الخادم حالياً حالة موثوق. لم تتم الكتابة فوق أي بيانات.",
    ),
    dtUntrusted: tr(
      "field.devices.dt.untrusted",
      "The backend device register does not currently grant trusted access.",
      "لا يمنح سجل الأجهزة في الخادم حالياً وصولاً موثوقاً.",
    ),

    enroll: tr("field.devices.enroll", "Enroll this device", "تسجيل هذا الجهاز"),
    enrolling: tr("field.devices.enrolling", "Requesting enrollment…", "جارٍ طلب التسجيل…"),
    enrollBlocked: tr(
      "field.devices.enrollBlocked",
      "Enrollment from this screen is disabled in this environment. Ask Operations to enroll this device.",
      "التسجيل من هذه الشاشة معطّل في هذه البيئة. اطلب من قسم العمليات تسجيل هذا الجهاز.",
    ),

    bioTitle: tr("field.devices.bio.title", "Face ID unlock", "فتح بالتعرف على الوجه"),
    bioOn: tr("field.devices.bio.on", "On", "مُفعّل"),
    bioOff: tr("field.devices.bio.off", "Off", "غير مُفعّل"),
    bioEnable: tr("field.devices.bio.enable", "Enable Face ID unlock", "تفعيل الفتح بالتعرف على الوجه"),
    bioEnabling: tr("field.devices.bio.enabling", "Setting up…", "جارٍ الإعداد…"),
    bioDisable: tr("field.devices.bio.disable", "Turn off Face ID unlock", "إيقاف الفتح بالتعرف على الوجه"),
    bioError: tr(
      "field.devices.bio.error",
      "Could not set up Face ID on this device. Your device may not support it, or the prompt was cancelled.",
      "تعذّر إعداد التعرّف على الوجه على هذا الجهاز. قد لا يدعمه جهازك، أو تم إلغاء الطلب.",
    ),

    bioChecking: tr(
      "field.devices.bio.checking",
      "Checking whether this device offers Face ID / Touch ID…",
      "جارٍ التحقق مما إذا كان هذا الجهاز يوفّر التعرّف على الوجه / بصمة الإصبع…",
    ),
    bioInsecure: tr(
      "field.devices.bio.insecure",
      "Face ID unlock needs a secure (HTTPS) connection. This page is not being served over one, so it cannot be set up here.",
      "يتطلب الفتح بالتعرف على الوجه اتصالاً آمناً (HTTPS). لا يتم تقديم هذه الصفحة عبر اتصال آمن، لذا لا يمكن إعداده هنا.",
    ),
    bioUnsupported: tr(
      "field.devices.bio.unsupported",
      "This device does not report a built-in authenticator (Face ID / Touch ID), so this cannot be enabled here.",
      "هذا الجهاز لا يُبلغ عن مُصادِق مدمج (تعرّف على الوجه / بصمة إصبع)، لذا لا يمكن تفعيله من هنا.",
    ),
    bioDeviceUntrusted: tr(
      "field.devices.bio.deviceUntrusted",
      "Face ID unlock becomes available only after the device register above reports this device as trusted. It is unavailable until then.",
      "يصبح الفتح بالتعرف على الوجه متاحاً فقط بعد أن يُظهر سجل الأجهزة أعلاه أن هذا الجهاز موثوق. وهو غير متاح حتى ذلك الحين.",
    ),
    bioReady: tr(
      "field.devices.bio.ready",
      "This device supports Face ID / Touch ID. Turning it on lets you reopen the field app without retyping your password on this trusted device.",
      "يدعم هذا الجهاز التعرّف على الوجه / بصمة الإصبع. تفعيله يتيح إعادة فتح التطبيق الميداني دون إعادة كتابة كلمة المرور على هذا الجهاز الموثوق.",
    ),
    bioActive: tr(
      "field.devices.bio.active",
      "This browser can reopen your already-signed-in session with Face ID instead of retyping your password.",
      "يمكن لهذا المتصفح إعادة فتح جلستك المسجّلة مسبقاً بالتعرف على الوجه بدلاً من إعادة كتابة كلمة المرور.",
    ),
    bioActiveInactive: tr(
      "field.devices.bio.activeInactive",
      "Set up on this browser, but currently inactive: the sign-in screen offers it only while the device register reports this device as trusted.",
      "تم إعداده على هذا المتصفح، لكنه غير نشط حالياً: تعرضه شاشة تسجيل الدخول فقط طالما أن سجل الأجهزة يُظهر هذا الجهاز موثوقاً.",
    ),

    bioScopeNote: tr(
      "field.devices.bio.scopeNote",
      "Verification stays on this device (Secure Enclave) and your biometric data never leaves it. This is a device-local lock over a session you are already signed in to — the result is not sent to or verified by any server, so it is not a passkey, not a sign-in credential, and not a second factor. It cannot sign you in on its own, and untrusted devices continue to use password sign-in.",
      "يتم التحقق على هذا الجهاز فقط (Secure Enclave) ولا تغادر بياناتك الحيوية الجهاز أبداً. هذا قفل محلي على جلسة أنت مسجّل الدخول إليها بالفعل — لا تُرسل النتيجة إلى أي خادم ولا يتحقق منها أي خادم، لذا فهو ليس مفتاح مرور ولا بيانات اعتماد لتسجيل الدخول ولا عامل تحقق ثانٍ. لا يمكنه تسجيل دخولك بمفرده، وتستمر الأجهزة غير الموثوقة في استخدام كلمة المرور.",
    ),
    registerNote: tr(
      "field.devices.registerNote",
      "The local device identifier is generated on-device. Trust and revocation are controlled by the backend device register and by Operations, not by this screen.",
      "يُنشأ معرّف الجهاز المحلي على الجهاز. تُدار الثقة والإلغاء عبر سجل الأجهزة في الخادم وقسم العمليات، وليس من هذه الشاشة.",
    ),
  };

  const backBtn = (
    <Link href="/field/settings" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
    </Link>
  );

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.devices.title", "Trusted Devices", "الأجهزة الموثوقة")}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <TrustedDevicesClient
        locale={locale}
        userId={user.id}
        userLabel={user.email ?? user.id}
        strings={strings}
      />
    </>
  );
}
