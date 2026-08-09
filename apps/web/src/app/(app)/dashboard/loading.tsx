import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton/dashboard-skeleton";
import Shell from "@/components/Shell";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function DashboardLoading() {
  const locale = await getLocale();
  const { dashboard } = getMessages(locale);
  return (
    <Shell current="/dashboard" title={dashboard.title}>
      <DashboardSkeleton label={dashboard.loadingDetail} />
    </Shell>
  );
}
