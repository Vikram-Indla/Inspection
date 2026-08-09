/* @retiring 2026-08-10 · replaced-by app/(app)/compliance/approvals · pending none — middleware.ts rewrites /admin/compliance-approvals to /compliance/approvals unconditionally, so no request reaches this segment · delete-when 0-imports */
"use client";

export default function ComplianceApprovalQueueError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const ar = typeof document !== "undefined" && !document.cookie.includes("locale=en");
  return <div className="sq-surface"><div className="sq-state" role="alert"><span className="sq-state__glyph" aria-hidden="true">⚠</span><h4>{ar ? "تعذّر تحميل قائمة بانتظار الاعتماد" : "Awaiting Approval can't load"}</h4><p className="sq-caption">{ar ? "لم يظهر أي عبء عمل أو حالة طلب، ولم يُسجّل أي قرار." : "No request state or workload is shown, and no decision was recorded."}</p><button className="sq-btn sq-btn--secondary" type="button" onClick={() => reset()}>{ar ? "إعادة المحاولة" : "Retry"}</button></div></div>;
}
