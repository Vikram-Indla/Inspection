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
  return c.get("login_locale")?.value === "en" ? "en" : "ar";
}

export default async function Login() {
  const locale = await resolveLocale();
  const ar = locale === "ar";
  const demoEnabled = process.env.SAQEEL_DEMO_ACCESS_ENABLED === "1";
  // Demo credentials are deployment secrets, never source constants. Even
  // when the demo switch is on, an identity is offered only when both values
  // were explicitly supplied by the environment.
  const demoIdentity = (label: string, dest: string, key: string) => {
    const email = process.env[`SAQEEL_DEMO_${key}_EMAIL`];
    const password = process.env[`SAQEEL_DEMO_${key}_PASSWORD`];
    return email && password ? { label, dest, email, password } : null;
  };

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
    authErrorInvalid: ar
      ? "تعذّر تسجيل الدخول بهذه البيانات. تحقّق منها أو أعد تعيين كلمة المرور."
      : "We could not sign you in with those details. Check your information or reset your password.",
    authErrorNetwork: ar
      ? "تعذّر الوصول إلى خدمة تسجيل الدخول. تحقّق من الاتصال وحاول مرة أخرى."
      : "We could not reach the sign-in service. Check your connection and try again.",
    authErrorGeneric: ar
      ? "تعذّر تسجيل الدخول. حاول مرة أخرى أو أعد تعيين كلمة المرور."
      : "We could not sign you in. Try again or reset your password.",
    resetErrorGeneric: ar
      ? "تعذّر إرسال رابط إعادة التعيين. تحقّق من الاتصال وحاول مرة أخرى."
      : "We could not send the reset link. Check your connection and try again.",
    emailInvalid: ar ? "أدخل بريدًا إلكترونيًا صالحًا." : "Enter a valid email address.",
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
    securityNote: ar
      ? "لحمايتك، لا نؤكد أبدًا وجود حساب من عدمه."
      : "For your security, we never confirm whether an account exists.",
    langHref: ar ? "/locale?set=en" : "/locale?set=ar",
    langLabel: ar ? "English" : "العربية",
    themeToLight: ar ? "الوضع الفاتح" : "Light mode",
    themeToDark: ar ? "الوضع الداكن" : "Dark mode",
    story: {
      title: ar
        ? "أطلس التفتيش الصناعي في صقيل"
        : "The Saqeel industrial inspection atlas",
      overline: ar ? "رحلة تفتيش واحدة · من البداية إلى النهاية" : "ONE VISIT · END TO END",
      illustrativeSummary: ar ? "بيانات توضيحية · غير حية · الأقرب في مسار الجولة أولًا" : "Illustrative sample · not live data · nearest on the illustrated route first",
      zoneStats: ar ? [
        { zone: "المنطقة الشرقية", inspections: "318", detail: "90% · 62 كم" },
        { zone: "المنطقة الشمالية", inspections: "264", detail: "91% · 146 كم" },
        { zone: "المنطقة الغربية", inspections: "247", detail: "89% · 265 كم" },
        { zone: "المنطقة الجنوبية", inspections: "198", detail: "89% · 394 كم" },
        { zone: "المنطقة الوسطى", inspections: "221", detail: "92% · 458 كم" },
      ] : [
        { zone: "Eastern zone", inspections: "318", detail: "90% · 62 km" },
        { zone: "Northern zone", inspections: "264", detail: "91% · 146 km" },
        { zone: "Western zone", inspections: "247", detail: "89% · 265 km" },
        { zone: "Southern zone", inspections: "198", detail: "89% · 394 km" },
        { zone: "Central zone", inspections: "221", detail: "92% · 458 km" },
      ],
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
    },
    demo: {
      title: ar ? "حسابات تجريبية" : "Demo access",
      hint: ar
        ? "لا يوجد اختيار عام بين الإدارة والبوابة — الدور يحدد الوجهة بعد الدخول. اختر حسابًا تجريبيًا لتعبئة النموذج."
        : "There's no public admin/portal toggle — your role decides the destination after sign-in. Pick a demo identity to fill the form.",
    },
    demoAccounts: demoEnabled ? [
      demoIdentity(ar ? "الإدارة" : "Administrator", ar ? "وحدة الإدارة" : "Admin console", "ADMIN"),
      demoIdentity(ar ? "مخطّط" : "Planner", ar ? "التخطيط" : "Planning", "PLANNER"),
      demoIdentity(ar ? "مفتّش" : "Inspector", ar ? "الميدان" : "Field", "INSPECTOR"),
      demoIdentity(ar ? "مراجِع" : "Reviewer", ar ? "المراجعة" : "Reviews", "REVIEWER"),
      demoIdentity(ar ? "التشغيل" : "Operations", ar ? "مركز العمليات" : "Operations", "OPS"),
    ].filter((account): account is NonNullable<typeof account> => account !== null) : [],
  };

  return <LoginClient strings={strings} />;
}
