import Shell from "@/components/Shell";
import { StateSurface } from "@/components/saqeel";
import { getLocale } from "@/lib/i18n";

export default async function AnalyticsLoading() {
  return (
    <Shell current="/analytics" title="">
      <StateSurface kind="loading" locale={await getLocale()} />
    </Shell>
  );
}
