import Button from "@/components/saqeel/button/button";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import AnalyticsFilters from "@/components/sections/analytics/analytics-filters/analytics-filters";
import AnalyticsBlocked from "@/components/sections/analytics/analytics-blocked/analytics-blocked";
import AnalyticsBreakdowns from "@/components/sections/analytics/analytics-breakdowns/analytics-breakdowns";
import AnalyticsCounts from "@/components/sections/analytics/analytics-counts/analytics-counts";
import AnalyticsRates from "@/components/sections/analytics/analytics-rates/analytics-rates";
import { analyticsMessages } from "@/features/analytics/strings";
import { buildAnalyticsView } from "@/features/analytics/view";
import { fill } from "@/i18n/messages";
import type { AnalyticsQuery, AnalyticsRpcRow } from "@/lib/analytics/contract";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./analytics-screen.module.css";

export default function AnalyticsScreen({ rows, query, locale, degraded, stale, affectedSource, refreshedAt }: {
  rows: readonly AnalyticsRpcRow[];
  query: AnalyticsQuery;
  locale: Locale;
  degraded: boolean;
  stale: boolean;
  affectedSource: string | null;
  refreshedAt: string;
}) {
  const strings = analyticsMessages(locale);
  const view = buildAnalyticsView(rows, locale);
  const sourceTone = degraded ? "warning" : stale ? "neutral" : "success";
  const sourceLabel = degraded
    ? strings.source.degraded
    : stale ? strings.source.stale : strings.source.available;

  return (
    <div className={styles.screen}>
      <div className={styles.head}>
        <span>
          <Heading level={1}>{strings.title}</Heading>
          <Text tone="secondary">
            {fill(strings.subtitle, { from: query.periodFrom, to: query.periodTo })}
          </Text>
        </span>
        <nav className={styles.journey} aria-label={strings.journey.label}>
          <StatusPill tone={sourceTone}>{sourceLabel}</StatusPill>
          <Button variant="secondary" size="sm" href="/operations" label={strings.journey.operations}>
            {strings.journey.operations}
          </Button>
          <Button variant="secondary" size="sm" href="/execution" label={strings.journey.execution}>
            {strings.journey.execution}
          </Button>
          <Button variant="secondary" size="sm" href="/reviews" label={strings.journey.reviews}>
            {strings.journey.reviews}
          </Button>
        </nav>
      </div>

      <AnalyticsFilters query={query} strings={strings} locale={locale} />

      {query.compareFrom && query.compareTo ? (
        <EmptyState variant="inline" tone="info" icon="radar"
          title={fill(strings.compare.notice, { from: query.compareFrom, to: query.compareTo })} />
      ) : null}

      {degraded && affectedSource ? (
        <EmptyState variant="inline" tone="warning" icon="risk"
          title={strings.source.degraded}
          description={fill(strings.source.degradedBody, { source: affectedSource })} />
      ) : null}

      {stale ? (
        <EmptyState variant="inline" tone="info" icon="risk"
          title={strings.source.stale}
          description={fill(strings.source.staleBody, { at: formatDateTime(refreshedAt, locale) })} />
      ) : null}

      {view.rates.length || view.counts.length ? (
        <>
          <div className={styles.split}>
            <AnalyticsRates rates={view.rates} strings={strings} query={query} />
            <AnalyticsBreakdowns breakdowns={view.breakdowns} strings={strings} locale={locale} />
          </div>
          <AnalyticsCounts counts={view.counts} strings={strings} query={query} locale={locale} />
          <AnalyticsBlocked blocked={view.blocked} resolved={view.rates.length + view.counts.length}
            strings={strings} locale={locale} />
        </>
      ) : (
        <EmptyState icon="radar" title={strings.empty.title} description={strings.empty.body} />
      )}
    </div>
  );
}
