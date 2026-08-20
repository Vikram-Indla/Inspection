"use client";
import { usePathname, useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import Button from "@/components/saqeel/button/button";
import DateRangePicker, { type DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./enforcement-filter-bar.module.css";

export type EnforcementFilterStrings = {
  readonly aria: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly status: string;
  readonly region: string;
  readonly range: string;
  readonly anyDate: string;
  readonly from: string;
  readonly to: string;
  readonly pickStart: string;
  readonly pickEnd: string;
  readonly clearDate: string;
  readonly apply: string;
  readonly clear: string;
  readonly export: string;
};

type Override = Partial<Record<"q" | "status" | "from" | "to" | "region", string>>;

export default function EnforcementFilterBar({
  locale, search, status, from, to, region, statusOptions, regionOptions, presets,
  monthLabels, filtered, clearHref, exportHref, strings,
}: {
  locale: Locale;
  search: string;
  status: string;
  from: string;
  to: string;
  region: string;
  statusOptions: readonly SelectOption[];
  regionOptions: readonly SelectOption[];
  presets: readonly DateRangePreset[];
  monthLabels: { previous: string; next: string };
  filtered: boolean;
  clearHref: string;
  exportHref: string;
  strings: EnforcementFilterStrings;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ui: "ar" | "en" = locale === "ar" ? "ar" : "en";

  const go = (overrides: Override) => {
    const merged = { q: search, status, from, to, region, ...overrides };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    if (merged.region) params.set("region", merged.region);
    const suffix = params.toString();
    router.push(suffix ? `${pathname}?${suffix}` : pathname);
  };

  const commitSearch = (value: string) => {
    const next = value.trim();
    if (next !== search) go({ q: next });
  };
  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitSearch(event.currentTarget.value);
    }
  };

  return (
    <div className={styles.bar} role="search" aria-label={strings.aria}>
      <input
        key={search}
        className={styles.input}
        type="search"
        defaultValue={search}
        placeholder={strings.searchPlaceholder}
        aria-label={strings.searchLabel}
        onKeyDown={onSearchKeyDown}
        onBlur={event => commitSearch(event.currentTarget.value)}
      />

      <SaqeelSelect
        options={statusOptions}
        value={status}
        onChange={value => go({ status: value })}
        label={strings.status}
      />
      <DateRangePicker
        label={strings.range}
        from={from}
        to={to}
        onChange={range => go({ from: range.from, to: range.to })}
        displayValue={from && to ? formatDateRange(from, to, locale) : strings.anyDate}
        presets={presets}
        locale={ui}
        monthLabels={monthLabels}
        strings={{
          from: strings.from,
          to: strings.to,
          pickStart: strings.pickStart,
          pickEnd: strings.pickEnd,
          reset: strings.clearDate,
          apply: strings.apply,
          empty: strings.anyDate,
        }}
        clearable
      />
      <SaqeelSelect
        options={regionOptions}
        value={region}
        onChange={value => go({ region: value })}
        label={strings.region}
      />

      <div className={styles.actions}>
        {filtered ? <Button variant="link" href={clearHref} label={strings.clear}>{strings.clear}</Button> : null}
        <Button variant="secondary" href={exportHref} label={strings.export}>{strings.export}</Button>
      </div>
    </div>
  );
}
