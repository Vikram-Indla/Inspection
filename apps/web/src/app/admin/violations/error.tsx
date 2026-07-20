"use client";

import { useEffect, useRef } from "react";

export default function ViolationsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const ar = typeof document !== "undefined" && !document.cookie.includes("locale=en");
  const copy = ar
    ? { title: "إعداد المخالفات غير متاح", body: "تعذّر تحميل الكتالوج. لم يُعرض أي ادعاء بعدد صفري أو حالة سليمة.", retry: "إعادة المحاولة" }
    : { title: "Violation configuration is unavailable", body: "The catalogue could not be loaded. No zero-count or healthy-state claim has been made.", retry: "Retry" };
  return (
    <main id="main-content" className="stack" style={{ padding: "var(--ax-space-400)" }}>
      <section className="ax-banner ax-banner--critical" role="alert" aria-labelledby="violations-error-title">
        <div className="stack" style={{ gap: "var(--ax-space-150)" }}>
          <h1 id="violations-error-title" ref={headingRef} tabIndex={-1}>{copy.title}</h1>
          <p>{copy.body}</p>
          <button type="button" className="ax-btn ax-btn--prominent" onClick={reset}>{copy.retry}</button>
        </div>
      </section>
    </main>
  );
}
