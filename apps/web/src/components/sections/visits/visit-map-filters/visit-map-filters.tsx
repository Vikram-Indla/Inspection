"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/saqeel/button/button";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import { windowDateRangePresets, type DateRangePresetLabels } from "@/components/saqeel/date-range-picker/date-range-presets";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import { mapHref, type VisitMapFilter } from "@/features/visits/map";
import { formatDateRange } from "@/lib/dates";
import styles from "./visit-map-filters.module.css";

export type VisitMapFilterStrings = {
  readonly filtersTitle: string;
  readonly regionLabel: string;
  readonly allRegions: string;
  readonly riskLabel: string;
  readonly allRisk: string;
  readonly windowLabel: string;
  readonly windowAny: string;
  readonly reset: string;
};

const CLEARED: VisitMapFilter = { region: "", risk: "", from: "", to: "" };

export default function VisitMapFilters({
  filter, regions, riskOptions, basePath, locale, presetLabels, monthLabels, strings,
}: {
  filter: VisitMapFilter;
  regions: readonly string[];
  riskOptions: readonly { readonly value: string; readonly label: string }[];
  basePath: string;
  locale: "ar" | "en";
  presetLabels: DateRangePresetLabels;
  monthLabels: { previous: string; next: string };
  strings: VisitMapFilterStrings;
}) {
  const router = useRouter();
  const apply = (next: VisitMapFilter) => router.push(mapHref(basePath, next, 0));
  const isCleared = filter.region === "" && filter.risk === "" && filter.from === "" && filter.to === "";
  const windowValue = filter.from === "" && filter.to === ""
    ? strings.windowAny
    : formatDateRange(filter.from, filter.to, locale);

  return (
    <section className={styles.root} aria-label={strings.filtersTitle}>
      <div className={styles.field}>
        <Field label={strings.regionLabel}>
          <SaqeelSelect
            label={strings.regionLabel}
            value={filter.region}
            onChange={region => apply({ ...filter, region })}
            options={[{ value: "", label: strings.allRegions }, ...regions.map(name => ({ value: name, label: name }))]}
          />
        </Field>
      </div>
      <div className={styles.field}>
        <Field label={strings.riskLabel}>
          <SaqeelSelect
            label={strings.riskLabel}
            value={filter.risk}
            onChange={risk => apply({ ...filter, risk })}
            options={[{ value: "", label: strings.allRisk }, ...riskOptions]}
          />
        </Field>
      </div>
      <div className={styles.field}>
        <Field label={strings.windowLabel}>
          <DateRangePicker
            block
            from={filter.from}
            to={filter.to}
            onChange={range => apply({ ...filter, from: range.from, to: range.to })}
            label={strings.windowLabel}
            displayValue={windowValue}
            presets={windowDateRangePresets(presetLabels)}
            locale={locale}
            monthLabels={monthLabels}
          />
        </Field>
      </div>
      <div className={styles.action}>
        <Button
          variant="tertiary"
          href={isCleared ? undefined : mapHref(basePath, CLEARED, 0)}
          disabled={isCleared}
        >
          {strings.reset}
        </Button>
      </div>
    </section>
  );
}
