"use client";

import { useEffect } from "react";

export default function PackageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[admin packages boundary]", error); }, [error]);
  const ar = typeof document !== "undefined" && !document.cookie.includes("locale=en");
  const copy = ar
    ? { title: "تعذّر تحميل مكتبة الحزم", body: "لم يكتمل الطلب. لا يمكننا معرفة ما إذا كانت القائمة فارغة أو حدث خطأ.", retry: "إعادة المحاولة" }
    : { title: "Couldn’t load the package library", body: "The request didn’t finish. We can’t tell if this is empty or an error.", retry: "Try again" };
  return (
    <main className="sq-content" style={{ padding: "var(--space-8)" }}>
      <div className="sq-banner sq-banner--critical" role="alert">
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          <button type="button" className="btn btn-primary btn-lg btn-touch" onClick={reset}>{copy.retry}</button>
        </div>
      </div>
    </main>
  );
}
