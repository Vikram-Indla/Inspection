import "../login/login.css";
import { cookies } from "next/headers";
import ResetClient, { type ResetStrings } from "./ResetClient";

export const dynamic = "force-dynamic";

// SCR-PUB-010 (reset leg) — lands the Supabase recovery link. The email link
// carries a recovery token in the URL fragment; supabase-js establishes a
// short-lived recovery session on load, then the user sets a new password.
type Locale = "ar" | "en";

async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("locale")?.value === "en" ? "en" : "ar";
}

export default async function Reset() {
  const locale = await resolveLocale();
  const ar = locale === "ar";

  const strings: ResetStrings = {
    dir: ar ? "rtl" : "ltr",
    lang: locale,
    brandTitle: ar ? "منصّة التفتيش الصناعي" : "Industrial Inspection Platform",
    brandSub: ar ? "وزارة الصناعة والثروة المعدنية" : "Ministry of Industry & Mineral Resources",
    checking: ar ? "جارٍ التحقق من رابط إعادة التعيين…" : "Verifying your reset link…",
    invalidTitle: ar ? "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" : "This reset link is invalid or has expired",
    invalidBody: ar ? "اطلب رابطًا جديدًا من صفحة تسجيل الدخول." : "Request a new link from the sign-in page.",
    title: ar ? "تعيين كلمة مرور جديدة" : "Set a new password",
    sub: ar ? "اختر كلمة مرور جديدة لحسابك." : "Choose a new password for your account.",
    pwLabel: ar ? "كلمة المرور الجديدة" : "New password",
    pwPlaceholder: ar ? "أدخل كلمة المرور الجديدة" : "Enter a new password",
    pw2Label: ar ? "تأكيد كلمة المرور الجديدة" : "Confirm new password",
    pw2Placeholder: ar ? "أعد إدخال كلمة المرور" : "Re-enter the password",
    showPw: ar ? "إظهار كلمة المرور" : "Show password",
    hidePw: ar ? "إخفاء كلمة المرور" : "Hide password",
    mismatch: ar ? "كلمتا المرور غير متطابقتين" : "The passwords don't match",
    save: ar ? "حفظ كلمة المرور" : "Save new password",
    saving: ar ? "جارٍ الحفظ…" : "Saving…",
    doneTitle: ar ? "تم تحديث كلمة المرور" : "Password updated",
    doneBody: ar ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة." : "You can now sign in with your new password.",
    toSignIn: ar ? "الذهاب إلى تسجيل الدخول" : "Go to sign in",
  };

  return <ResetClient strings={strings} />;
}
