import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";
import { useT } from "@/lib/i18n";

export default async function DashboardLoading() {
  const { t, locale } = await useT();
  const ar = locale === "ar";
  return (
    <Shell current="/dashboard" title={t("dashboard.title", ar ? "لوحة القيادة" : "Dashboard")}>
      <div role="status" aria-busy="true" aria-live="polite">
        <EmptyState glyph="◫" title={ar ? "جارٍ تحميل لوحة القيادة…" : "Loading dashboard…"}
          body={ar ? "جارٍ تحميل مصادر لوحة القيادة المقيّدة حسب صلاحيات الصفوف." : "Loading dashboard sources filtered to your access."} />
      </div>
    </Shell>
  );
}
