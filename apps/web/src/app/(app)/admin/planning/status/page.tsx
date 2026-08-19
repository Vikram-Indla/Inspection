import StatusScreen from "@/components/sections/admin-planning-status/status-screen";
import { loadPlanningStatus } from "@/features/admin-planning-status/queries";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function PlanningStatusPage() {
  const [locale, data] = await Promise.all([getLocale(), loadPlanningStatus()]);

  return <StatusScreen data={data} locale={locale} />;
}
