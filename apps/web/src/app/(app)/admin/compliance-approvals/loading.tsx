/* @retiring 2026-08-10 · replaced-by app/(app)/compliance/approvals · pending none — middleware.ts rewrites /admin/compliance-approvals to /compliance/approvals unconditionally, so no request reaches this segment · delete-when 0-imports */
import { getLocale } from "@/lib/i18n";

export default async function ComplianceApprovalQueueLoading() {
  const ar = await getLocale() === "ar";
  return <div className="panel"><div className="sq-state" role="status" aria-live="polite"><span className="sq-state__glyph" aria-hidden="true">◌</span><h4>{ar ? "جارٍ تحميل قائمة بانتظار الاعتماد" : "Loading Awaiting Approval"}</h4><p className="t-caption">{ar ? "جارٍ قراءة الطلبات والمكوّنات والتبعيات…" : "Reading requests, components and dependencies…"}</p></div></div>;
}
