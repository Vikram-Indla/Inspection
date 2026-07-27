import { getLocale } from "@/lib/i18n";

export default async function ComplianceApprovalQueueLoading() {
  const ar = await getLocale() === "ar";
  return <div className="panel"><div className="sq-state" role="status" aria-live="polite"><span className="sq-state__glyph" aria-hidden="true">◌</span><h4>{ar ? "جارٍ تحميل قائمة اعتماد إعدادات الامتثال" : "Loading Compliance Approval Queue"}</h4><p className="t-caption">{ar ? "جارٍ قراءة الطلبات والمكوّنات والتبعيات المقيّدة بسياسات RLS…" : "Reading RLS-scoped requests, components and dependencies…"}</p></div></div>;
}
