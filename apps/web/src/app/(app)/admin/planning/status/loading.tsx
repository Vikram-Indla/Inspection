import StatusSkeleton from "@/components/sections/admin-planning-status/status-skeleton";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function PlanningStatusLoading() {
  const locale = await getLocale();
  return <StatusSkeleton label={getMessages(locale).adminPlanningStatus.loading} />;
}
