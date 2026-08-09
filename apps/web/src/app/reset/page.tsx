import "../login/login.css";
import { cookies, headers } from "next/headers";
import ResetClient, { type ResetStrings } from "./ResetClient";

export const dynamic = "force-dynamic";

// SCR-PUB-010 (reset leg) — continues after /login verifies the emailed OTP.
// verifyOtp establishes the short-lived recovery session, then the user sets a
// new password here.
type Locale = "ar" | "en";

// Same rule as getLocale() in @/lib/i18n: an explicit choice wins, otherwise
// follow the browser. This previously returned Arabic for every state that was
// not exactly "en", so an English reader arriving from a reset link with no
// cookie yet was shown Arabic.
async function resolveLocale(): Promise<Locale> {
  const chosen = (await cookies()).get("locale")?.value;
  if (chosen === "ar" || chosen === "en") return chosen;
  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  return /(^|[,\s])ar\b/.test(accept) ? "ar" : "en";
}

export default async function Reset() {
  const locale = await resolveLocale();
  const ar = locale === "ar";

  const strings: ResetStrings = {
    dir: ar ? "rtl" : "ltr",
    lang: locale,
    brandTitle: "صقيل | صناعي",
    brandSub: ar ? "منصّة التفتيش الصناعي" : "Industrial Inspection Platform",
    checking: ar ? "جارٍ التحقق من جلسة الاسترداد…" : "Verifying your recovery session…",
    invalidTitle: ar ? "جلسة الاسترداد غير صالحة أو منتهية الصلاحية." : "This recovery session is invalid or has expired.",
    invalidBody: ar ? "اطلب رمزًا جديدًا من صفحة تسجيل الدخول." : "Request a new code from the sign-in page.",
    invalidHint: ar
      ? "اختر \"هل نسيت كلمة المرور؟\" في صفحة تسجيل الدخول لطلب رمز جديد."
      : "Select \"Forgot your password?\" on the sign-in page to request a new code.",
    requestTitle: ar ? "استعادة كلمة المرور" : "Reset your password",
    requestSub: ar
      ? "أدخل بريدك الإلكتروني لنرسل إليك رمز تحقق."
      : "Enter your email and we'll send you a verification code.",
    emailLabel: ar ? "البريد الإلكتروني" : "Email",
    emailPlaceholder: ar ? "أدخل بريدك الإلكتروني" : "Enter your email",
    send: ar ? "إرسال رمز إعادة التعيين" : "Send reset code",
    sending: ar ? "جارٍ الإرسال…" : "Sending…",
    sentAria: ar ? "تحقق من بريدك الإلكتروني" : "Check your email",
    sentBody: ar
      ? "إذا كان هناك حساب مسجّل بهذا العنوان، فقد أرسلنا إليه رمزًا مكوّنًا من 6 أرقام. أدخل الرمز أدناه."
      : "If an account exists for that address, we've sent a 6-digit code to it. Enter the code below.",
    otpLabel: ar ? "رمز التحقق" : "Verification code",
    otpPlaceholder: ar ? "أدخل الرمز المكوّن من 6 أرقام" : "Enter the 6-digit code",
    verify: ar ? "التحقق من الرمز" : "Verify code",
    verifying: ar ? "جارٍ التحقق…" : "Verifying…",
    otpError: ar
      ? "الرمز غير صحيح أو منتهي الصلاحية. حاول مرة أخرى."
      : "That code is incorrect or has expired. Try again.",
    back: ar ? "رجوع" : "Back",
    title: ar ? "تعيين كلمة مرور جديدة" : "Set a new password",
    sub: ar ? "اختر كلمة مرور جديدة لحسابك." : "Choose a new password for your account.",
    pwLabel: ar ? "كلمة المرور الجديدة" : "New password",
    pwPlaceholder: ar ? "أدخل كلمة المرور الجديدة" : "Enter a new password",
    pw2Label: ar ? "تأكيد كلمة المرور الجديدة" : "Confirm new password",
    pw2Placeholder: ar ? "أعد إدخال كلمة المرور" : "Re-enter the password",
    showPw: ar ? "إظهار كلمة المرور" : "Show password",
    hidePw: ar ? "إخفاء كلمة المرور" : "Hide password",
    mismatch: ar ? "كلمتا المرور غير متطابقتين" : "The passwords don't match",
    policyError: ar
      ? "كلمة المرور الجديدة لا تستوفي متطلبات الأمان المحددة لهذه المنصّة."
      : "The new password doesn't meet the security requirements set for this platform.",
    saveTransportError: ar
      ? "تعذّر حفظ كلمة المرور الجديدة. تحقّق من الاتصال وحاول مرة أخرى."
      : "We couldn't save the new password. Check your connection and try again.",
    saveUnexpectedError: ar ? "حدث خطأ ما. حاول مرة أخرى." : "Something went wrong. Try again.",
    save: ar ? "حفظ كلمة المرور" : "Save new password",
    saving: ar ? "جارٍ الحفظ…" : "Saving…",
    doneTitle: ar ? "تم تحديث كلمة المرور" : "Password updated",
    doneBody: ar
      ? "تم تسجيل خروجك من جلسة الاسترداد. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة."
      : "You've been signed out of the recovery session. You can now sign in with your new password.",
    toSignIn: ar ? "الذهاب إلى تسجيل الدخول" : "Go to sign in",
    langHref: ar ? "/locale?set=en" : "/locale?set=ar",
    langLabel: ar ? "English" : "العربية",
    themeToLight: ar ? "الوضع الفاتح" : "Light mode",
    themeToDark: ar ? "الوضع الداكن" : "Dark mode",
  };

  return <ResetClient strings={strings} />;
}
