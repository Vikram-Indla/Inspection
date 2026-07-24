import { cookies } from "next/headers";
import FieldLoginClient, { type FieldLoginStrings } from "./FieldLoginClient";

export const dynamic = "force-dynamic";

// SAQEEL Field Login (PWA / iPad channel).
//
// Source of truth: Claude Design `SAQEEL Field Login.dc.html`
// (project 5e8154ad-9a7d-4e3d-9b7a-c66ca020bd61). Every Arabic and English
// string below is transcribed verbatim from that DC's STR table.
//
// This route is deliberately separate from /login. /login is the shared web
// console sign-in governed by TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001, whose
// wordmark is locked to "صقيل | صناعي" and which carries no biometric path.
// The field channel is a different surface with a different identity model
// (national ID, trusted device, offline-first), so it gets its own route
// rather than overwriting a sponsor-approved artifact.

type Locale = "ar" | "en";

async function resolveLocale(searchLang?: string): Promise<Locale> {
  if (searchLang === "en" || searchLang === "ar") return searchLang;
  const c = await cookies();
  return c.get("login_locale")?.value === "en" ? "en" : "ar";
}

export default async function FieldLogin({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const locale = await resolveLocale(langParam);
  const ar = locale === "ar";

  const strings: FieldLoginStrings = ar
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
        copyright: "صقيل © 2026",
        bioUnavailable:
          "تعذّر إكمال الفتح بالتعرف على الوجه على هذا الجهاز. استخدم كلمة المرور.",
        bioFallback: "استخدم كلمة المرور بدلاً من ذلك",
        directoryBlocked:
          "تسجيل الدخول بالهوية الوطنية أو رقم المنسوب غير مُفعّل بعد — لم يُسلَّم عقد دليل الوزارة. استخدم بريد العمل الإلكتروني.",
        authInvalid:
          "تعذّر تسجيل الدخول بهذه البيانات. تحقّق منها أو أعد تعيين كلمة المرور.",
        authNetwork: "تعذّر الوصول إلى خدمة تسجيل الدخول. تحقّق من الاتصال وحاول مرة أخرى.",
        signingIn: "جارٍ الدخول…",
        unlocking: "جارٍ التحقق…",
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
        copyright: "SAQEEL © 2026",
        bioUnavailable:
          "Face ID unlock could not be completed on this device. Use your password.",
        bioFallback: "Use password instead",
        directoryBlocked:
          "National ID / staff number sign-in is not enabled yet — the ministry directory contract has not been supplied. Use your work email address.",
        authInvalid:
          "We could not sign you in with those details. Check your information or reset your password.",
        authNetwork:
          "We could not reach the sign-in service. Check your connection and try again.",
        signingIn: "Signing in…",
        unlocking: "Verifying…",
      };

  return <FieldLoginClient s={strings} dir={ar ? "rtl" : "ltr"} lang={locale} />;
}
