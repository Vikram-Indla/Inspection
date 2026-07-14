import { getLocale } from "@/lib/i18n";

export default async function DashboardLoading() {
  const locale = await getLocale();
  const ar = locale === "ar";
  return <main className="ax-content" aria-busy="true" aria-live="polite">
    <div className="ax-surface ax-state"><span className="ax-state__glyph" aria-hidden="true">◫</span><h2>{ar ? "جارٍ تحميل لوحة القيادة…" : "Loading dashboard…"}</h2><p className="ax-caption">{ar ? "جارٍ تحميل مصادر لوحة القيادة المقيّدة حسب صلاحيات الصفوف." : "Loading RLS-scoped dashboard sources."}</p></div>
  </main>;
}
