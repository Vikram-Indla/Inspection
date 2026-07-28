"use client";

import { StateSurface } from "@/components/saqeel/feedback/StateSurface";
import { useEffect, useState } from "react";

export default function ExecutionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [arabic, setArabic] = useState(false);
  useEffect(() => setArabic(document.documentElement.lang === "ar" || document.documentElement.dir === "rtl"), []);
  const reference = error.digest ? (arabic ? ` المرجع ${error.digest}.` : ` Reference ${error.digest}.`) : "";
  return <StateSurface
    kind="error"
    title={arabic ? "التنفيذ غير متاح" : "Execution unavailable"}
    body={`${arabic ? "لم يتم تغيير أي حالة تفتيش." : "No inspection state was changed."}${reference}`}
    action={<button className="sq-btn sq-btn--secondary" type="button" onClick={reset}>{arabic ? "إعادة المحاولة" : "Retry"}</button>}
  />;
}
