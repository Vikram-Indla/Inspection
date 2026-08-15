"use client";

import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import { pastDateRangePresets } from "@/components/saqeel/date-range-picker/date-range-presets";
import Select from "@/components/saqeel/select/select";
import type { AnalyticsMessages } from "@/features/analytics/strings";
import type { AnalyticsQuery } from "@/lib/analytics/contract";
import { formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { KSA_REGION_LABELS } from "@/lib/ksa-regions";
import styles from "./analytics-filters.module.css";

const METHODS = ["bulk", "single", "immediate"] as const;
const STATUSES = ["published", "executing", "submitted", "approved", "rejected"] as const;

export default function AnalyticsFilters({ query, strings, locale }: {
  query: AnalyticsQuery;
  strings: AnalyticsMessages;
  locale: Locale;
}) {
  const filters = strings.filters;
  const ui: "ar" | "en" = locale === "ar" ? "ar" : "en";
  const [period, setPeriod] = useState({ from: query.periodFrom, to: query.periodTo });
  const [compare, setCompare] = useState({ from: query.compareFrom ?? "", to: query.compareTo ?? "" });

  const option = (value: string) => {
    const label = filters[value as keyof typeof filters];
    return { value, label: typeof label === "string" ? label : value };
  };
  const pickerStrings = {
    from: filters.from,
    to: filters.to,
    pickStart: filters.pickStart,
    pickEnd: filters.pickEnd,
    reset: filters.clear,
    apply: filters.apply2,
    empty: filters.anyDate,
  };
  const shared = {
    presets: pastDateRangePresets(filters.presets),
    locale: ui,
    monthLabels: { previous: filters.previousMonth, next: filters.nextMonth },
    strings: pickerStrings,
  };

  return (
    <Card as="section">
      <CardBody>
        <form className={styles.form} method="get" action="/analytics" aria-label={filters.legend}>
          <Field label={filters.period}>
          <DateRangePicker
            {...shared}
            label={filters.period}
            from={period.from}
            to={period.to}
            onChange={setPeriod}
            displayValue={formatDateRange(period.from, period.to, locale)}
            nameFrom="periodFrom"
            nameTo="periodTo"
          />
          </Field>
          <Field label={filters.compare}>
          <DateRangePicker
            {...shared}
            label={filters.compare}
            from={compare.from}
            to={compare.to}
            onChange={setCompare}
            clearable
            displayValue={compare.from && compare.to
              ? formatDateRange(compare.from, compare.to, locale)
              : filters.anyDate}
            nameFrom="compareFrom"
            nameTo="compareTo"
          />
          </Field>

          <Field label={filters.region} htmlFor="analytics-region">
          <Select
            id="analytics-region"
            name="region"
            label={filters.region}
            defaultValue={query.region ?? ""}
            placeholder={filters.any}
            options={[
              { value: "", label: filters.any },
              ...Object.values(KSA_REGION_LABELS).map(region => ({ value: region.en, label: region[ui] })),
            ]}
          />
          </Field>
          <Field label={filters.method} htmlFor="analytics-method">
          <Select
            id="analytics-method"
            name="method"
            label={filters.method}
            defaultValue={query.method ?? ""}
            placeholder={filters.any}
            options={[{ value: "", label: filters.any }, ...METHODS.map(option)]}
          />
          </Field>
          <Field label={filters.status} htmlFor="analytics-status">
          <Select
            id="analytics-status"
            name="status"
            label={filters.status}
            defaultValue={query.status ?? ""}
            placeholder={filters.any}
            options={[{ value: "", label: filters.any }, ...STATUSES.map(option)]}
          />
          </Field>

          <span className={styles.actions}>
            <Button variant="primary" size="sm" type="submit" label={filters.apply}>{filters.apply}</Button>
            <Button variant="tertiary" size="sm" href="/analytics" label={filters.reset}>{filters.reset}</Button>
          </span>
        </form>
      </CardBody>
    </Card>
  );
}
