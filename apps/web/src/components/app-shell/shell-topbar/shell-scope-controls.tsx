"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import { pastDateRangePresets, type DateRangePresetLabels } from "@/components/saqeel/date-range-picker/date-range-presets";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { formatDateRange } from "@/lib/dates";
import { resolveRegionId, KSA_REGION_LABELS } from "@/lib/ksa-regions";
import type { ShellScope } from "@/features/shell/types";
import styles from "./shell-topbar.module.css";

type ScopeStrings = Readonly<Record<
  "dateScope" | "from" | "to" | "apply" | "regionScope" | "allRegions"
  | "notApplicable" | "previousMonth" | "nextMonth" | "anyDate",
  string
>> & { readonly presets: DateRangePresetLabels };

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

  const regionLabel = (name: string) => {
    const id = resolveRegionId(name);
    if (!id) return name;
    return locale === "ar" ? KSA_REGION_LABELS[id].ar : KSA_REGION_LABELS[id].en;
  };
  const regionOptions: readonly SelectOption[] = [
    { value: "", label: strings.allRegions },
    ...regions.map(name => ({ value: name, label: regionLabel(name) })),
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
        displayValue={from && to ? formatDateRange(from, to, locale) : strings.anyDate}
        presets={pastDateRangePresets(strings.presets)}
        locale={locale}
        monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
        disabled={!scope.date}
        clearable
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
