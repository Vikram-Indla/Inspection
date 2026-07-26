import "./login.css";
import { cookies } from "next/headers";
import FieldLoginClient, { type FieldLoginStrings } from "./field/FieldLoginClient";

export const dynamic = "force-dynamic";

// Single authentication surface. Decorative story/atlas implementations are
// intentionally absent: /login renders only the real credential experience.

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

  return (
    <div className="lg-page" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <FieldLoginClient s={fieldStrings} dir={ar ? "rtl" : "ltr"} lang={locale}
        localeHref={ar ? "/locale?set=en" : "/locale?set=ar"}
        returnTo={sp.next} reason={sp.reason} />
    </div>
  );
}
