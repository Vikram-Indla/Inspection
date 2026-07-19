import { getLocale } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";

export default async function DashboardLoading() {
  const locale = await getLocale();
  const ar = locale === "ar";
  return <main className="ax-content" aria-busy="true" aria-live="polite">
    <EmptyState glyph="◫" title={ar ? "جارٍ تحميل لوحة القيادة…" : "Loading dashboard…"}
      body={ar ? "جارٍ تحميل مصادر لوحة القيادة المقيّدة حسب صلاحيات الصفوف." : "Loading RLS-scoped dashboard sources."} />
  </main>;
}
