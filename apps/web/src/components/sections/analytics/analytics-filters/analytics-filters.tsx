import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import Select from "@/components/saqeel/select/select";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import styles from "./analytics-filters.module.css";

const METHODS = ["bulk", "single", "immediate"] as const;
const STATUSES = ["published", "executing", "submitted", "approved", "rejected"] as const;

export default function AnalyticsFilters({ query, strings }: {
  query: AnalyticsQuery;
  strings: AnalyticsMessages;
}) {
  const filters = strings.filters;
  const option = (value: string) => ({ value, label: filters[value as keyof typeof filters] ?? value });

  return (
    <Card as="section">
      <CardBody>
        <form className={styles.form} method="get" action="/analytics" aria-label={filters.legend}>
          <Field label={filters.from} htmlFor="analytics-from">
            <input className={styles.date} id="analytics-from" type="date" name="periodFrom"
              defaultValue={query.periodFrom} />
          </Field>
          <Field label={filters.to} htmlFor="analytics-to">
            <input className={styles.date} id="analytics-to" type="date" name="periodTo"
              defaultValue={query.periodTo} />
          </Field>
          <Field label={filters.region} htmlFor="analytics-region">
            <input className={styles.date} id="analytics-region" type="search" name="region"
              defaultValue={query.region ?? ""} />
          </Field>

          <Select
            name="method"
            label={filters.method}
            defaultValue={query.method ?? ""}
            placeholder={filters.any}
            options={[{ value: "", label: filters.any }, ...METHODS.map(option)]}
          />
          <Select
            name="status"
            label={filters.status}
            defaultValue={query.status ?? ""}
            placeholder={filters.any}
            options={[{ value: "", label: filters.any }, ...STATUSES.map(option)]}
          />

          <span className={styles.actions}>
            <Button variant="primary" size="sm" type="submit" label={filters.apply}>{filters.apply}</Button>
            <Button variant="tertiary" size="sm" href="/analytics" label={filters.reset}>{filters.reset}</Button>
          </span>
        </form>
      </CardBody>
    </Card>
  );
}
