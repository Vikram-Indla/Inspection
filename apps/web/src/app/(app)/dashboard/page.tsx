import { Suspense } from "react";
import DashboardScreen from "@/components/experimental/dashboard/dashboard-screen";
import DashboardSkeleton from "@/components/experimental/dashboard/dashboard-skeleton";
import { readDashboardScope, type DashboardScopeInput } from "@/features/dashboard/scope";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<DashboardScopeInput>;
}) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const { dashboard } = getMessages(locale);
  const scope = readDashboardScope(params, Date.now());

  return (
    <Suspense fallback={<DashboardSkeleton label={dashboard.loading} />}>
      <DashboardScreen locale={locale} scope={scope} />
    </Suspense>
  );
}
