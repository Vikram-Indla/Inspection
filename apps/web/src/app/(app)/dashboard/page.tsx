import { Suspense } from "react";
import Shell from "@/components/Shell";
import { readDashboardScope, type DashboardScopeInput } from "@/features/dashboard/scope";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import DashboardSkeleton from "@/components/dashboard/dashboard-skeleton/dashboard-skeleton";
import DashboardSections from "@/components/dashboard/dashboard-sections/dashboard-sections";

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<DashboardScopeInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { dashboard } = getMessages(locale);
  const scope = readDashboardScope(params, Date.now());

  return (
    <Shell current="/dashboard" title="">
      <Suspense fallback={<DashboardSkeleton label={dashboard.loading} />}>
        <DashboardSections locale={locale} scope={scope} />
      </Suspense>
    </Shell>
  );
}
