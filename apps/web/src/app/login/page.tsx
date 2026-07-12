import "./login.css";
import { cookies } from "next/headers";
import LoginClient, { type LoginStrings } from "./LoginClient";

export const dynamic = "force-dynamic";

// SCR-PUB-010 — national sign-in, patterned on app.industry.sa/auth/login:
// centered card, Nafath (unified national access) as the primary method,
// credential sign-in as the alternative under an OR divider. Arabic-first.
// Channel/role is resolved server-side by /launch after auth and is never
// exposed on this screen.
type Locale = "ar" | "en";

async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("locale")?.value === "en" ? "en" : "ar";
}

export default async function Login() {
  const locale = await resolveLocale();
  const ar = locale === "ar";

  const strings: LoginStrings = {
    dir: ar ? "rtl" : "ltr",
    lang: locale,
    govBanner: ar ? "موقع حكومي رسمي تابع لحكومة المملكة العربية السعودية" : "Official government website of the Kingdom of Saudi Arabia",
    brandTitle: ar ? "منصّة التفتيش الصناعي" : "Industrial Inspection Platform",
    brandSub: ar ? "وزارة الصناعة والثروة المعدنية" : "Ministry of Industry & Mineral Resources",
    cardTitle: ar ? "الدخول إلى منصة التفتيش الصناعي" : "Sign in to the Inspection Platform",
    cardSub: ar ? "ادخل بحسابك لمتابعة أعمال التفتيش وإدارتها" : "Access your account to run and manage inspection work",
    nafathTitle: ar ? "الدخول عبر النفاذ الوطني الموحّد (نفاذ)" : "Sign in via the Unified National Access (Nafath)",
    nafathSub: ar ? "طريقة سريعة وآمنة لتسجيل الدخول" : "A fast and secure way to sign in.",
    or: ar ? "أو" : "OR",
    idLabel: ar ? "رقم الهوية، الإقامة أو البريد الإلكتروني" : "National ID, Iqama, or Email",
    idPlaceholder: ar ? "أدخل رقم الهوية أو البريد الإلكتروني" : "Kindly enter your ID or Email",
    pwLabel: ar ? "كلمة المرور" : "Password",
    pwPlaceholder: ar ? "أدخل كلمة المرور" : "Kindly enter your Password",
    showPw: ar ? "إظهار كلمة المرور" : "Show password",
    hidePw: ar ? "إخفاء كلمة المرور" : "Hide password",
    signIn: ar ? "تسجيل الدخول" : "Sign In",
    signingIn: ar ? "جارٍ الدخول…" : "Signing in…",
    // Nafath simulation sub-flow
    nidLabel: ar ? "رقم الهوية الوطنية أو الإقامة" : "National ID or Iqama number",
    nidHint: ar ? "10 أرقام" : "10 digits",
    continueBtn: ar ? "متابعة" : "Continue",
    back: ar ? "رجوع" : "Back",
    waitingTitle: ar ? "بانتظار الموافقة في تطبيق نفاذ" : "Waiting for approval in the Nafath app",
    waitingBody: ar ? "افتح تطبيق نفاذ واختر الرقم التالي لإتمام التحقق:" : "Open the Nafath app and select the number below to confirm:",
    simulatedNote: ar
      ? "خطوة تجريبية — ستُستبدل بربط فعلي مع خدمة نفاذ الرسمية عند توفّر التكامل."
      : "Simulated step — will be replaced with a live Nafath integration once the official service is connected.",
    approveSimulated: ar ? "لقد وافقت في التطبيق (تجريبي)" : "I approved in the app (simulated)",
    verifiedBanner: ar ? "تم التحقق من هويتك عبر نفاذ. أكمل الدخول ببيانات حسابك." : "Identity verified via Nafath. Complete sign-in with your account.",
    footTrust: ar ? "كل إجراء داخل جلستك موثَّق ومراجَع" : "Every action inside your session is recorded and reviewable",
    footSecure: ar ? "اتصال مشفّر" : "Encrypted connection",
    backToLanding: ar ? "الصفحة الرئيسية" : "Home",
    langHref: ar ? "/locale?set=en" : "/locale?set=ar",
    langLabel: ar ? "English" : "العربية",
  };

  return <LoginClient strings={strings} />;
}
