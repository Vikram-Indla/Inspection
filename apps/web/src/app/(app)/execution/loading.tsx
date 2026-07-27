import { StateSurface } from "@/components/saqeel/feedback/StateSurface";
import { useT } from "@/lib/i18n";

export default async function ExecutionLoading() {
  const { locale } = await useT();
  return <StateSurface
    kind="loading"
    title={locale === "ar" ? "جارٍ تحميل التنفيذ" : "Loading Execution"}
    body={locale === "ar" ? "جارٍ تحميل التقويم المعتمد والإسنادات والحالات التشغيلية ضمن نطاق صلاحياتك." : "Loading the governed calendar, assignments, and operational states in your scope."}
  />;
}
