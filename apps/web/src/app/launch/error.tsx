"use client";
// CD-003 frame 1e — role-resolution / network failure with a safe retry.
// Next.js requires route error boundaries to be Client Components, so this
// cannot call the server-only useT()/cookies() localization helper the rest
// of the app uses; locale is read directly from the "locale" cookie exactly
// as ThemeToggle reads the theme attribute directly. Never renders the raw
// thrown error — error.message is intentionally unused.
import "../login/login.css";
import AccessState from "@/components/AccessState";

function locale(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  return document.cookie.includes("locale=en") ? "en" : "ar";
}

const COPY = {
  ar: { heading: "تعذّر تحديد دورك", body: "حدث خطأ أثناء تحديد دورك. تحقّق من الاتصال وحاول مرة أخرى.", retry: "إعادة المحاولة", signOut: "تسجيل الخروج" },
  en: { heading: "We couldn't check your role", body: "Something went wrong while resolving your role. Check your connection and try again.", retry: "Try again", signOut: "Sign out" },
};

export default function LaunchError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const ar = locale() === "ar";
  const c = ar ? COPY.ar : COPY.en;

  return (
    <AccessState
      tone="critical"
      dir={ar ? "rtl" : "ltr"}
      lang={ar ? "ar" : "en"}
      heading={c.heading}
      body={c.body}
      actions={
        <>
          <button type="button" className="btn btn-primary btn-lg lg-submit btn-touch" onClick={reset}>{c.retry}</button>
          <a className="lg-linkbtn" href="/signout">{c.signOut}</a>
        </>
      }
    />
  );
}
