"use client";

import { usePathname, useRouter } from "next/navigation";
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

type Override = Partial<Record<
  "periodFrom" | "periodTo" | "compareFrom" | "compareTo" | "region" | "method" | "status",
  string | null
>>;

export default function AnalyticsFilters({ query, strings, locale }: {
  query: AnalyticsQuery;
  strings: AnalyticsMessages;
  locale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const filters = strings.filters;
  const ui: "ar" | "en" = locale === "ar" ? "ar" : "en";

  const go = (override: Override) => {
    const base: Record<string, string | null> = {
      periodFrom: query.periodFrom,
      periodTo: query.periodTo,
      compareFrom: query.compareFrom,
      compareTo: query.compareTo,
      region: query.region,
      factoryId: query.factoryId,
      method: query.method,
      status: query.status,
      visitStatus: query.visitStatus,
      reviewStatus: query.reviewStatus,
      groupBy: query.groupBy,
      tab: query.tab,
      ...override,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(base)) {
      if (value && !(key === "groupBy" && value === "none") && !(key === "tab" && value === "overview")) {
        params.set(key, value);
      }
    }
    const suffix = params.toString();
    router.push(suffix ? `${pathname}?${suffix}` : pathname);
  };

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
        <div className={styles.form} role="group" aria-label={filters.legend}>
          <Field label={filters.period} htmlFor="analytics-period">
            <DateRangePicker
              {...shared}
              id="analytics-period"
              block
              label={filters.period}
              from={query.periodFrom}
              to={query.periodTo}
              onChange={range => go({ periodFrom: range.from, periodTo: range.to })}
              displayValue={formatDateRange(query.periodFrom, query.periodTo, locale)}
            />
          </Field>
          <Field label={filters.compare} htmlFor="analytics-compare">
            <DateRangePicker
              {...shared}
              id="analytics-compare"
              block
              clearable
              label={filters.compare}
              from={query.compareFrom ?? ""}
              to={query.compareTo ?? ""}
              onChange={range => go({ compareFrom: range.from || null, compareTo: range.to || null })}
              displayValue={query.compareFrom && query.compareTo
                ? formatDateRange(query.compareFrom, query.compareTo, locale)
                : filters.anyDate}
            />
          </Field>

          <Field label={filters.region} htmlFor="analytics-region">
            <Select
              id="analytics-region"
              label={filters.region}
              value={query.region ?? ""}
              onChange={value => go({ region: value || null })}
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
              label={filters.method}
              value={query.method ?? ""}
              onChange={value => go({ method: value || null })}
              placeholder={filters.any}
              options={[{ value: "", label: filters.any }, ...METHODS.map(option)]}
            />
          </Field>
          <Field label={filters.status} htmlFor="analytics-status">
            <Select
              id="analytics-status"
              label={filters.status}
              value={query.status ?? ""}
              onChange={value => go({ status: value || null })}
              placeholder={filters.any}
              options={[{ value: "", label: filters.any }, ...STATUSES.map(option)]}
            />
          </Field>

          <span className={styles.actions}>
            <Button variant="tertiary" size="sm" href={pathname} label={filters.reset}>{filters.reset}</Button>
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
