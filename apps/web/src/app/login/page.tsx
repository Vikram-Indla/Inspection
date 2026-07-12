import "./login.css";
import { cookies } from "next/headers";
import LoginClient, { type LoginStrings } from "./LoginClient";

export const dynamic = "force-dynamic";

// SCR-PUB-010 v4 — Saqeel unified sign-in, from the accepted Claude Design
// direction (Login.dc.html Turn 4, "the inspection story"). One quiet, fast
// page for every persona: a solid credential panel on the start side (no text
// over imagery — strongest WCAG posture) beside a story panel that tells one
// sample inspection journey on a framed KSA map with a Plan → Inspect →
// Review → Decide strip built from the real modules. No persona selector and
// no live operational intelligence on this public surface — role is resolved
// server-side by /launch (RBAC-001..014), and the live coverage / risk /
// inspector-movement view lives behind auth on the Operations Center. Nafath
// and the gov banner stay retired (DEC-011).
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
    wordmarkFull: "صقيل | صناعي",
    cardTitle: ar ? "تسجيل الدخول" : "Sign in",
    cardSub: ar
      ? "ادخل بحسابك لمتابعة أعمال التفتيش الصناعي وإدارتها"
      : "Access your account to run and manage industrial inspection work",
    idLabel: ar ? "البريد الإلكتروني" : "Email",
    idPlaceholder: "name@mim.gov.sa",
    pwLabel: ar ? "كلمة المرور" : "Password",
    pwPlaceholder: ar ? "أدخل كلمة المرور" : "Enter your password",
    showPw: ar ? "إظهار كلمة المرور" : "Show password",
    hidePw: ar ? "إخفاء كلمة المرور" : "Hide password",
    signIn: ar ? "تسجيل الدخول" : "Sign In",
    signingIn: ar ? "جارٍ الدخول…" : "Signing in…",
    forgotLink: ar ? "هل نسيت كلمة المرور؟" : "Forgot your password?",
    forgotTitle: ar ? "إعادة تعيين كلمة المرور" : "Reset your password",
    forgotSub: ar
      ? "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور."
      : "Enter your email and we'll send you a link to reset your password.",
    forgotSend: ar ? "إرسال رابط إعادة التعيين" : "Send reset link",
    forgotSending: ar ? "جارٍ الإرسال…" : "Sending…",
    forgotSentTitle: ar ? "تحقّق من بريدك الإلكتروني" : "Check your email",
    forgotSentBody: ar
      ? "إذا كان هناك حساب مرتبط بهذا البريد، فسيصل رابط لإعادة تعيين كلمة المرور. تحقّق من مجلد الرسائل غير المرغوبة أيضًا."
      : "If an account exists for that address, a password-reset link is on its way. Check your spam folder too.",
    back: ar ? "رجوع" : "Back",
    footTrust: ar ? "كل إجراء داخل جلستك موثَّق ومراجَع" : "Every action inside your session is recorded and reviewable",
    footSecure: ar ? "اتصال مشفّر" : "Encrypted connection",
    footCopyright: ar
      ? "صقيل — وزارة الصناعة والثروة المعدنية © 2026"
      : "Saqeel — Ministry of Industry and Mineral Resources © 2026",
    langHref: ar ? "/locale?set=en" : "/locale?set=ar",
    langLabel: ar ? "English" : "العربية",
    themeToLight: ar ? "الوضع الفاتح" : "Light mode",
    themeToDark: ar ? "الوضع الداكن" : "Dark mode",
    story: {
      title: ar
        ? "قصة التفتيش في صقيل — من الخطة إلى القرار"
        : "The Saqeel inspection story — from plan to decision",
      // Mono overline stays LTR/EN in both locales (design: JetBrains Mono label).
      overline: "ONE VISIT, END TO END · SAMPLE — ILLUSTRATIVE",
      mapLabels: {
        riyadh: ar ? "الرياض" : "RIYADH",
        jubail: ar ? "الجبيل" : "JUBAIL",
      },
      steps: [
        {
          n: "01",
          title: ar ? "التخطيط" : "Plan",
          body: ar
            ? "زيارات تُجدول حسب الخطورة، وتُسند وفق عبء العمل والقرب الجغرافي"
            : "Risk-based visit planning; assignment by workload, capacity and proximity",
        },
        {
          n: "02",
          title: ar ? "التفتيش" : "Inspect",
          body: ar
            ? "تحقق جغرافي عند بوابة المصنع، قوائم فحص وأدلة — ويعمل دون اتصال"
            : "Geofenced check-in at the gate, checklists and evidence — works offline",
        },
        {
          n: "03",
          title: ar ? "المراجعة" : "Review",
          body: ar
            ? "تدقيق المستوى الثاني للأدلة والنتائج قبل اعتماد النتيجة"
            : "Level-2 verification of evidence and findings before approval",
        },
        {
          n: "04",
          title: ar ? "القرار" : "Decide",
          body: ar
            ? "قرار امتثال يُسجَّل في ملف المصنع 360 ويُعيد احتساب الخطورة"
            : "Compliance decision recorded to Factory 360; risk re-scored",
        },
      ],
    },
    demo: {
      title: ar ? "حسابات تجريبية" : "Demo access",
      hint: ar
        ? "لا يوجد اختيار عام بين الإدارة والبوابة — الدور يحدد الوجهة بعد الدخول. اختر حسابًا تجريبيًا لتعبئة النموذج."
        : "There's no public admin/portal toggle — your role decides the destination after sign-in. Pick a demo identity to fill the form.",
    },
    demoAccounts: [
      { label: ar ? "الإدارة" : "Administrator", dest: ar ? "وحدة الإدارة" : "Admin console", email: "admin@mim.gov.sa", password: "MimAdmin!2026" },
      { label: ar ? "مخطّط" : "Planner", dest: ar ? "التخطيط" : "Planning", email: "planner@mim.gov.sa", password: "MimPlan!2026" },
      { label: ar ? "مفتّش" : "Inspector", dest: ar ? "الميدان" : "Field", email: "inspector@mim.gov.sa", password: "MimField!2026" },
      { label: ar ? "مراجِع" : "Reviewer", dest: ar ? "المراجعة" : "Reviews", email: "reviewer@mim.gov.sa", password: "MimRev!2026" },
      { label: ar ? "التشغيل" : "Operations", dest: ar ? "مركز العمليات" : "Operations", email: "ops@mim.gov.sa", password: "MimOps!2026" },
    ],
  };

  return <LoginClient strings={strings} />;
}
