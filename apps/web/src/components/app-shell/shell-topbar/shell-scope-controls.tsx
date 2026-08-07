"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker, { type DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { formatDateRange } from "@/lib/dates";
import type { ShellScope } from "@/features/shell/types";
import styles from "./shell-topbar.module.css";

type ScopeStrings = Readonly<Record<
  "dateScope" | "last30Days" | "from" | "to" | "apply" | "regionScope" | "allRegions"
  | "notApplicable" | "previousMonth" | "nextMonth"
  | "today" | "yesterday" | "last7Days" | "thisMonth" | "thisQuarter" | "thisYear",
  string
>>;

export default function ShellScopeControls({ scope, regions, initialFrom, initialTo, initialRegion, locale, strings }: {
  scope: ShellScope;
  regions: readonly string[];
  initialFrom: string;
  initialTo: string;
  initialRegion: string;
  locale: "ar" | "en";
  strings: ScopeStrings;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFrom(params.get("from") ?? initialFrom);
    setTo(params.get("to") ?? initialTo);
    setRegion(params.get("region") ?? initialRegion);
  }, [initialFrom, initialRegion, initialTo]);

  function replaceScope(updates: Readonly<Record<string, string>>): void {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }

  const regionOptions: readonly SelectOption[] = [
    { value: "", label: strings.allRegions },
    ...regions.map(name => ({ value: name, label: name })),
  ];

  const presets: readonly DateRangePreset[] = [
    { id: "today", label: strings.today, days: 1 },
    { id: "yesterday", label: strings.yesterday, days: 2 },
    { id: "last7", label: strings.last7Days, days: 7 },
    { id: "last30", label: strings.last30Days, days: 30 },
    { id: "month", label: strings.thisMonth, days: 30 },
    { id: "quarter", label: strings.thisQuarter, days: 90 },
    { id: "year", label: strings.thisYear, days: 365 },
  ];

  return (
    <div className={styles.scope}>
      <DateRangePicker
        from={from}
        to={to}
        onChange={range => {
          setFrom(range.from);
          setTo(range.to);
          replaceScope({ from: range.from, to: range.to });
        }}
        label={strings.dateScope}
        displayValue={formatDateRange(from, to, locale)}
        presets={presets}
        locale={locale}
        monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
        disabled={!scope.date}
      />

      <SaqeelSelect
        options={regionOptions}
        value={region}
        onChange={next => {
          setRegion(next);
          replaceScope({ region: next });
        }}
        label={strings.regionScope}
        placeholder={strings.allRegions}
        disabled={!scope.region || !regions.length}
      />
    </div>
  );
}
