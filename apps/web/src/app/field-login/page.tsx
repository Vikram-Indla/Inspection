import "./field-login.css";
import { cookies } from "next/headers";
import FieldLoginClient, { type FieldLoginStrings } from "./FieldLoginClient";

export const dynamic = "force-dynamic";

// SCR-PWA-001 — Field Inspector sign-in, from Claude Design "SAQEEL Field
// Login.dc.html". The PWA/installed-app entry (manifest start_url = /field)
// lands here when unauthenticated, instead of the desktop /login story-panel
// surface — mobile-first, single column, live network-status pill. Same real
// Supabase credential auth as /login; "Forgot password?" hands off to /login
// rather than duplicating that flow here.
type Locale = "ar" | "en";

async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("login_locale")?.value === "en" ? "en" : "ar";
}

export default async function FieldLogin() {
  const locale = await resolveLocale();
  const ar = locale === "ar";

  const strings: FieldLoginStrings = {
    dir: ar ? "rtl" : "ltr",
    lang: locale,
    brand1: "SAQEEL",
    brandAr: "صقيل",
    tagline: ar ? "تطبيق المفتّش الميداني · وزارة الصناعة والثروة المعدنية" : "Field Inspector App · Ministry of Industry & Mineral Resources",
    themeLabel: ar ? "الوضع" : "Theme",
    langBtn: ar ? "EN" : "AR",
    netOnline: ar ? "متصل" : "Online",
    netOffline: ar ? "دون اتصال — يعمل محلياً" : "Offline — working locally",
    idLabel: ar ? "البريد الإلكتروني" : "Email",
    idPlaceholder: "name@mim.gov.sa",
    password: ar ? "كلمة المرور" : "Password",
    pwPlaceholder: ar ? "أدخل كلمة المرور" : "Enter your password",
    showPw: ar ? "إظهار كلمة المرور" : "Show password",
    hidePw: ar ? "إخفاء كلمة المرور" : "Hide password",
    keepSignedIn: ar ? "إبقائي مسجّلاً" : "Keep me signed in",
    forgot: ar ? "نسيت كلمة المرور؟" : "Forgot password?",
    signIn: ar ? "تسجيل الدخول" : "Sign in",
    signingIn: ar ? "جارٍ الدخول…" : "Signing in…",
    authErrorInvalid: ar
      ? "تعذّر تسجيل الدخول بهذه البيانات. تحقّق منها أو أعد تعيين كلمة المرور."
      : "We could not sign you in with those details. Check your information or reset your password.",
    authErrorNetwork: ar
      ? "تعذّر الوصول إلى خدمة تسجيل الدخول. تحقّق من الاتصال وحاول مرة أخرى."
      : "We could not reach the sign-in service. Check your connection and try again.",
    authErrorGeneric: ar
      ? "تعذّر تسجيل الدخول. حاول مرة أخرى أو أعد تعيين كلمة المرور."
      : "We could not sign you in. Try again or reset your password.",
    emailInvalid: ar ? "أدخل بريدًا إلكترونيًا صالحًا." : "Enter a valid email address.",
    offlineNote: ar
      ? "التطبيق يعمل دون اتصال: تُحفظ زياراتك وأدلّتك محلياً وتُزامَن تلقائياً عند عودة الشبكة."
      : "The app works offline: your visits and evidence are saved locally and sync automatically when the network returns.",
    copyright: ar ? "صقيل © 2026" : "SAQEEL © 2026",
    langHref: ar ? "/locale?set=en" : "/locale?set=ar",
  };

  return <FieldLoginClient strings={strings} />;
}
