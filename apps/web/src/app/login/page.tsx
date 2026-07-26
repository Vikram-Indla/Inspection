import "./login.css";
import { cookies } from "next/headers";
import FieldLoginClient, { type FieldLoginStrings } from "./field/FieldLoginClient";
import StoryPanel, { type StoryStrings } from "./StoryPanel";

export const dynamic = "force-dynamic";

// Unified sign-in. Per Product-Owner direction (2026-07-25): ONE responsive
// page that reuses the EXISTING, design-true pieces — no card is rebuilt here.
//   • Credential column = the real field/PWA login card (FieldLoginClient, the
//     SAQEEL PWA-Field Login.dc implementation): shield, SAQEEL lockup, trusted-
//     device + Face-ID path, National-ID / password, offline footer.
//   • Wide screens additionally show the inspection atlas (StoryPanel).
//   • Narrow screens and iPad (both orientations) show the card only — the
//     atlas is hidden by the media rules in login.css.
// The card is dark-locked (ThemeScript / ThemeChannelSync force dark on /login)
// and carries no theme control. Field-card strings are transcribed verbatim
// from the same DC used by /login/field; atlas strings are the accepted CD-001
// story copy.
//
// NOTE (flagged to PO): reusing the field card verbatim means its sign-in flow
// (national-ID/staff → work email, redirect to /field) now governs /login. This
// is the informed choice recorded in the session log; role-routed web-console
// entry is not offered on this surface.

type Locale = "ar" | "en";

async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("login_locale")?.value === "en" ? "en" : "ar";
}

export default async function Login({ searchParams }: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  // field/layout, Shell and FieldSessionBoundary all bounce here with ?next and
  // ?reason on an expired or unauthorized field session. Read them, or a signed
  // -out inspector loses the page they were on and the reason they were sent back.
  const sp = await searchParams;
  const locale = await resolveLocale();
  const ar = locale === "ar";

  // Field card strings — verbatim from /login/field (SAQEEL PWA-Field Login.dc).
  const fieldStrings: FieldLoginStrings = ar
    ? {
        brand1: "SAQEEL",
        tagline: "تطبيق المفتّش الميداني · وزارة الصناعة والثروة المعدنية",
        langBtn: "EN",
        netOnline: "متصل",
        netOffline: "دون اتصال — يعمل محلياً",
        trustedDevice: "جهاز موثوق",
        faceUnlock: "افتح بالتعرف على الوجه",
        faceDesc: "التحقق يتم على جهازك عبر Face ID — لا تُرسل بياناتك الحيوية إلى الخادم.",
        orPassword: "أو بكلمة المرور",
        idLabel: "الهوية الوطنية / رقم المنسوب",
        password: "كلمة المرور",
        showPw: "إظهار كلمة المرور",
        keepSignedIn: "إبقائي مسجّلاً",
        forgot: "نسيت كلمة المرور؟",
        signIn: "تسجيل الدخول",
        offlineNote:
          "التطبيق يعمل دون اتصال: تُحفظ زياراتك وأدلّتك محلياً وتُزامَن تلقائياً عند عودة الشبكة. القفل الحيوي متاح فقط على هذا الجهاز الموثوق.",
        dismiss: "إخفاء الملاحظة",
        copyright: "صقيل © 2026",
        bioUnavailable: "تعذّر إكمال الفتح بالتعرف على الوجه على هذا الجهاز. استخدم كلمة المرور.",
        bioFallback: "استخدم كلمة المرور بدلاً من ذلك",
        directoryBlocked:
          "تسجيل الدخول بالهوية الوطنية أو رقم المنسوب غير مُفعّل بعد — لم يُسلَّم عقد دليل الوزارة. استخدم بريد العمل الإلكتروني.",
        authInvalid: "تعذّر تسجيل الدخول بهذه البيانات. تحقّق منها أو أعد تعيين كلمة المرور.",
        authNetwork: "تعذّر الوصول إلى خدمة تسجيل الدخول. تحقّق من الاتصال وحاول مرة أخرى.",
        signingIn: "جارٍ الدخول…",
        unlocking: "جارٍ التحقق…",
        checkingSession: "جارٍ التحقق من جلسة المفتش…",
        sessionExpired: "انتهت جلستك أو تعذّر تجديدها. سجّل الدخول للمتابعة من المكان نفسه.",
        offlineKnown: "أنت دون اتصال. لا يمكن فتح الجلسة إلا إذا كانت جلسة المفتش المعروفة ما زالت صالحة على هذا الجهاز.",
        offlineLoginBlocked: "يتطلب تسجيل دخول جديد اتصالاً بالشبكة. أعد الاتصال ثم حاول مرة أخرى.",
        unauthorizedInspector: "هذا الحساب غير مخوّل لتطبيق المفتش. لم يتم فتح أي بيانات ميدانية.",
        signedOut: "تم تسجيل الخروج ومسح هوية الجلسة المحلية لهذا المستخدم.",
        continueOffline: "متابعة العمل دون اتصال",
      }
    : {
        brand1: "SAQEEL",
        tagline: "Field Inspector App · Ministry of Industry & Mineral Resources",
        langBtn: "AR",
        netOnline: "Online",
        netOffline: "Offline — working locally",
        trustedDevice: "Trusted device",
        faceUnlock: "Unlock with Face ID",
        faceDesc:
          "Verification happens on your device via Face ID — your biometric data is never sent to the server.",
        orPassword: "or use password",
        idLabel: "National ID / Staff number",
        password: "Password",
        showPw: "Show password",
        keepSignedIn: "Keep me signed in",
        forgot: "Forgot password?",
        signIn: "Sign in",
        offlineNote:
          "The app works offline: your visits and evidence are saved locally and sync automatically when the network returns. Biometric unlock is available only on this trusted device.",
        dismiss: "Dismiss this note",
        copyright: "SAQEEL © 2026",
        bioUnavailable: "Face ID unlock could not be completed on this device. Use your password.",
        bioFallback: "Use password instead",
        directoryBlocked:
          "National ID / staff number sign-in is not enabled yet — the ministry directory contract has not been supplied. Use your work email address.",
        authInvalid:
          "We could not sign you in with those details. Check your information or reset your password.",
        authNetwork:
          "We could not reach the sign-in service. Check your connection and try again.",
        signingIn: "Signing in…",
        unlocking: "Verifying…",
        checkingSession: "Checking your Inspector session…",
        sessionExpired: "Your session expired or could not be renewed. Sign in to continue from the same place.",
        offlineKnown: "You are offline. Access is limited to a still-valid, previously verified Inspector session on this device.",
        offlineLoginBlocked: "A new sign-in requires a network connection. Reconnect, then try again.",
        unauthorizedInspector: "This account is not authorized for the Inspector app. No field data was opened.",
        signedOut: "Signed out. This user's local session identity was cleared.",
        continueOffline: "Continue offline",
      };

  // Atlas / story strings — accepted CD-001 inspection-story copy.
  const story: StoryStrings = {
    // Login v2: the panel is the platform, not "the Saqeel atlas". The product
    // name already sits on the credential card beside it, so repeating it here
    // read as branding twice and called the panel by its mechanism.
    title: ar ? "منصة التفتيش الصناعي" : "Industrial inspection platform",
    overline: ar ? "رحلة تفتيش واحدة · من البداية إلى النهاية" : "ONE VISIT · END TO END",
    riyadhLabel: ar ? "الرياض · مسيّجة جغرافيًا" : "RIYADH · GEOFENCED",
    stagesLabel: ar ? "مشاهد قصة التفتيش" : "Inspection story scenes",
    stages: [
      { id: "plan", label: ar ? "الخريطة" : "Map", event: ar ? "خريطة المملكة والمنشآت الصناعية فقط" : "The Kingdom map and industrial sites establish context" },
      { id: "travel", label: ar ? "الإرسال" : "Dispatch", event: ar ? "مركبتان تنطلقان من الرياض، والثالثة من جازان، لكل منها وجهة تفتيش محددة" : "Two vehicles deploy from Riyadh and a third from Jazan, each on a defined inspection mission" },
      { id: "arrive", label: ar ? "الوصول" : "Arrival", event: ar ? "وصول الفرق إلى المواقع وتأكيد الحضور في نطاق المنشأة" : "Teams arrive at their sites and confirm geofenced attendance" },
      { id: "inspect", label: ar ? "التفتيش" : "Inspection", event: ar ? "توثيق الأدلة وإظهار نتيجة التفتيش والإجراءات المطلوبة" : "Evidence is captured and each inspection reaches an illustrated outcome" },
      { id: "decide", label: ar ? "المناطق" : "Zones", event: ar ? "مرّر المؤشر على منطقة لرفعها ككتلة أرضية ثلاثية الأبعاد وعرض ذكاء التفتيش" : "Hover a zone to lift it from the landmass and reveal regional inspection intelligence" },
    ],
    dossier: {
      industry: ar ? "الصناعة" : "Industry",
      state: ar ? "مرحلة الدورة" : "Lifecycle stage",
      close: ar ? "إغلاق" : "Close",
      mapLabel: ar ? "مواقع الأطلس الصناعي التفاعلية" : "Interactive industrial atlas locations",
    },
  };

  return (
    <div className="lg-page lg-page--split" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <FieldLoginClient s={fieldStrings} dir={ar ? "rtl" : "ltr"} lang={locale}
        localeHref={ar ? "/locale?set=en" : "/locale?set=ar"}
        returnTo={sp.next} reason={sp.reason} />
      <StoryPanel strings={story} locale={locale} />
    </div>
  );
}
