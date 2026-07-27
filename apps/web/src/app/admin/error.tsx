"use client";

import { useEffect, useState } from "react";

// WA-M9/M10-AC-004 — neutral recovery for dashboard/execution configuration.
// Do not expose provider details or report an unverified configuration value.
export default function AdminConfigurationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isArabic, setIsArabic] = useState(false);

  useEffect(() => {
    setIsArabic(document.documentElement.lang === "ar");
  }, []);

  return (
    <main className="sq-content" role="alert">
      <section className="sq-state panel">
        <span className="sq-state__glyph" aria-hidden="true">⚠</span>
        <h2>{isArabic ? "تعذّر تحميل التهيئة" : "The configuration could not be loaded"}</h2>
        <p className="t-caption">
          {isArabic
            ? "تعذّر التحقق من الصلاحيات أو قراءة المصدر الخاضع للحوكمة. لم يتغيّر شيء."
            : "Permissions or the governed source could not be verified. Nothing was changed."}
        </p>
        <button type="button" className="btn btn-primary btn-touch" onClick={reset}>
          {isArabic ? "إعادة المحاولة" : "Try again"}
        </button>
      </section>
    </main>
  );
}
