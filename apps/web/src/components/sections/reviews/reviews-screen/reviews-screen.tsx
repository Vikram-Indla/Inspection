import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import ReviewFilters from "@/components/sections/reviews/review-filters/review-filters";
import ReviewQueueTable from "@/components/sections/reviews/review-queue-table/review-queue-table";
import { buildQueueRows, buildRiskOptions, buildStatusOptions } from "@/features/reviews/queue-rows";
import type { ReviewsStrings } from "@/features/reviews/strings";
import type { LoadedQueue, QueueFilters, QueueRow } from "@/features/reviews/types";
import type { Locale } from "@/lib/i18n";
import styles from "./reviews-screen.module.css";

function matches(row: QueueRow, filters: QueueFilters): boolean {
  const needle = filters.query.trim().toLowerCase();
  const searchable = `${row.factoryName} ${row.factoryCode} ${row.inspectorName}`.toLowerCase();
  return (!needle || searchable.includes(needle))
    && (!filters.status || row.status === filters.status)
    && (!filters.risk || row.riskBand === filters.risk)
    && (!filters.overdueOnly || row.slaState === "overdue");
}

export default function ReviewsScreen({ loaded, filters, strings, locale }: {
  loaded: LoadedQueue;
  filters: QueueFilters;
  strings: ReviewsStrings;
  locale: Locale;
}) {
  const rows = buildQueueRows(loaded, strings, locale);

  // An empty queue is an answer, not a screen to decorate. The standing policy
  // notes and the degradation warnings only speak about rows, so with no rows
  // they have nothing to qualify and would leave the reader hunting for the one
  // line that matters.
  if (rows.length === 0) {
    return (
      <div className={styles.root}>
        <EmptyState icon="review" title={strings.empty.title} description={strings.empty.body} />
      </div>
    );
  }

  const visible = rows.filter(row => matches(row, filters));

  return (
    <div className={styles.root}>
      {loaded.degraded ? (
        <EmptyState variant="inline" tone="warning" icon="risk"
          title={strings.degraded.title} description={strings.degraded.body} />
      ) : null}
      {loaded.reviewDays == null ? (
        <EmptyState variant="inline" tone="warning" icon="risk"
          title={strings.missingSla.title} description={strings.missingSla.body} />
      ) : null}

      <Card as="section" labelledBy="reviews-queue-title">
        <CardHeader level="h2" titleId="reviews-queue-title" title={strings.title} description={strings.context} />
        <CardBody>
          <ReviewFilters
            filters={filters}
            statusOptions={buildStatusOptions(strings)}
            riskOptions={buildRiskOptions(loaded)}
            shown={visible.length}
            total={rows.length}
            strings={strings}
          />
          <ReviewQueueTable rows={visible} strings={strings} />
        </CardBody>
      </Card>
    </div>
  );
}
