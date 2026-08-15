import Shell from "@/components/Shell";
import AnalyticsSkeleton from "@/components/sections/analytics/analytics-skeleton/analytics-skeleton";
import { analyticsMessages } from "@/features/analytics/strings";
import { getLocale } from "@/lib/i18n";

export default async function AnalyticsLoading() {
  const locale = await getLocale();
  return (
    <Shell current="/analytics" title="">
      <AnalyticsSkeleton label={analyticsMessages(locale).loading} />
    </Shell>
  );
}
