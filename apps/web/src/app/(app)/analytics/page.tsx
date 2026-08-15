import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import AnalyticsScreen from "@/components/sections/analytics/analytics-screen/analytics-screen";
import { analyticsMessages } from "@/features/analytics/strings";
import { loadAnalytics } from "@/lib/analytics/loader";
import { parseAnalyticsQuery } from "@/lib/analytics/query-state";
import { supabaseServer } from "@/lib/supabase-server";
import { fill } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const parsed = parseAnalyticsQuery(await searchParams);

  return (
    <Shell current="/analytics" title="">
      {parsed.ok
        ? await resolveAnalytics(parsed.value, locale)
        : <EmptyState icon="risk" tone="danger"
            title={analyticsMessages(locale).error.invalidQuery}
            description={parsed.issues.join(" ")} />}
    </Shell>
  );
}

async function resolveAnalytics(query: AnalyticsQuery, locale: Locale) {
  const strings = analyticsMessages(locale);
  const result = await loadAnalytics(await supabaseServer(), query);

  if (result.kind === "unauthorized") {
    return <EmptyState icon="restricted" tone="warning"
      title={strings.denied.title} description={strings.denied.body} />;
  }
  if (result.kind === "error") {
    const reference = crypto.randomUUID();
    console.error(`[analytics:${reference}]`, result.message);
    return <EmptyState icon="risk" tone="danger" title={strings.error.title}
      description={`${strings.error.body} ${fill(strings.error.reference, { id: reference })}`} />;
  }

  return <AnalyticsScreen rows={result.rows} query={query} locale={locale}
    degraded={result.kind === "degraded"} stale={result.stale}
    affectedSource={result.affectedSource ?? null} refreshedAt={result.refreshedAt} />;
}
