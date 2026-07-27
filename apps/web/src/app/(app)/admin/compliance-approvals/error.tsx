"use client";

export default function ComplianceApprovalQueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const ar = typeof document !== "undefined" && !document.cookie.includes("locale=en");
  return <div className="sq-surface"><div className="sq-state" role="alert"><span className="sq-state__glyph" aria-hidden="true">⚠</span><h4>{ar ? "قائمة الاعتماد غير متاحة" : "Awaiting Approval unavailable"}</h4><p className="sq-caption">{ar ? "لم يتم استنتاج حالة أي طلب أو عبء العمل، ولم يُسجّل أي قرار." : "No request state or workload has been inferred, and no decision was recorded."}</p><button className="sq-btn sq-btn--secondary" type="button" onClick={() => reset()}>{ar ? "إعادة محاولة تحميل القائمة" : "Retry queue"}</button></div></div>;
}
