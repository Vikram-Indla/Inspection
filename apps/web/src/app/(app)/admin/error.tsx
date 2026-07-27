"use client";

import { useEffect, useState } from "react";

// WA-M6/M8/M9/M10-AC-004 — fail closed at the Admin segment. A failed read
// never becomes an empty catalogue, successful mutation, or authorization
// verdict. Nested modules may provide more specific recovery copy.
export default function AdminError({
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
        <h2>{isArabic ? "تعذّر فتح وجهة الإدارة" : "The administration destination could not be opened"}</h2>
        <p className="t-caption">
          {isArabic
            ? "تعذّر التحقق من الهوية أو الصلاحيات أو البيانات. لم يتم استنتاج حالة فارغة ولم يتغيّر شيء."
            : "Identity, permissions, or data could not be verified. No empty state was inferred and nothing was changed."}
        </p>
        <button type="button" className="btn btn-primary btn-touch" onClick={reset}>
          {isArabic ? "إعادة المحاولة" : "Try again"}
        </button>
      </section>
    </main>
  );
}
