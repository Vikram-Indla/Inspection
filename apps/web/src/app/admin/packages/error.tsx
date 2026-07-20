"use client";

import { useEffect } from "react";

export default function PackageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[admin packages boundary]", error); }, [error]);
  const ar = typeof document !== "undefined" && !document.cookie.includes("locale=en");
  const copy = ar
    ? { title: "تعذّر عرض مكتبة الحزم", body: "لم يكتمل الطلب. لم يُفترض وجود حالة فارغة أو عدد صفري.", retry: "إعادة المحاولة" }
    : { title: "Package library couldn’t be displayed", body: "The request did not complete. No empty or zero state has been inferred.", retry: "Try again" };
  return (
    <main className="ax-content" style={{ padding: "var(--ax-space-400)" }}>
      <div className="ax-banner ax-banner--critical" role="alert">
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          <button type="button" className="btn btn-primary btn-lg btn-touch" onClick={reset}>{copy.retry}</button>
        </div>
      </div>
    </main>
  );
}
