"use client";
import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import DateRangePicker, { type DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./visit-filter-bar.module.css";

export type VisitFilterChip = { readonly key: string; readonly label: string; readonly href: string };

type SelectState = {
  tab: string;
  sort: string;
  visitType: string;
  mode: string;
  region: string;
  city: string;
};

export type VisitFilterBarStrings = {
  readonly aria: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly status: string;
  readonly type: string;
  readonly mode: string;
  readonly region: string;
  readonly city: string;
  readonly window: string;
  readonly windowEmpty: string;
  readonly sortLabel: string;
  readonly more: string;
  readonly apply: string;
  readonly clearAll: string;
  readonly activeFilters: string;
  readonly removeFilter: string;
  readonly from: string;
  readonly to: string;
  readonly pickStart: string;
  readonly pickEnd: string;
  readonly reset: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
};

export type VisitFilterBarProps = {
  locale: Locale;
  action: string;
  strings: VisitFilterBarStrings;
  search: string;
  tab: string;
  statusOptions: readonly SelectOption[];
  visitType: string;
  visitTypeOptions: readonly SelectOption[];
  mode: string;
  modeOptions: readonly SelectOption[];
  region: string;
  regionOptions: readonly SelectOption[];
  city: string;
  cityOptions: readonly SelectOption[];
  windowFrom: string;
  windowTo: string;
  datePresets: readonly DateRangePreset[];
  sort: string;
  sortOptions: readonly SelectOption[];
  advancedCount: number;
  chips: readonly VisitFilterChip[];
  clearHref: string;
};

export default function VisitFilterBar(props: VisitFilterBarProps) {
  const { locale, action, strings, chips } = props;
  const [selection, setSelection] = useState<SelectState>({
    tab: props.tab, sort: props.sort, visitType: props.visitType,
    mode: props.mode, region: props.region, city: props.city,
  });
  const [range, setRange] = useState({ from: props.windowFrom, to: props.windowTo });
  const [open, setOpen] = useState(false);
  const bind = (key: keyof SelectState) => (value: string) => setSelection(prev => ({ ...prev, [key]: value }));
  const dateStrings = {
    from: strings.from, to: strings.to, pickStart: strings.pickStart, pickEnd: strings.pickEnd,
    reset: strings.reset, apply: strings.apply, empty: strings.windowEmpty,
  };
  const dateDisplay = range.from || range.to
    ? formatDateRange(range.from, range.to, locale)
    : strings.windowEmpty;
  const moreLabel = props.advancedCount > 0 ? `${strings.more} (${props.advancedCount})` : strings.more;

  return (
    <section className={styles.shell} aria-label={strings.aria}>
      <form className={styles.form} method="get" action={action}>
        <input type="hidden" name="tab" value={selection.tab} />
        <input type="hidden" name="sort" value={selection.sort} />
        <input type="hidden" name="visitType" value={selection.visitType} />
        <input type="hidden" name="mode" value={selection.mode} />
        <input type="hidden" name="region" value={selection.region} />
        <input type="hidden" name="city" value={selection.city} />
        <input type="hidden" name="windowFrom" value={range.from} />
        <input type="hidden" name="windowTo" value={range.to} />

        <div className={styles.primary}>
          <input className={styles.search} type="search" name="q" defaultValue={props.search}
            placeholder={strings.searchPlaceholder} aria-label={strings.searchLabel} />
          <SaqeelSelect options={props.statusOptions} value={selection.tab} onChange={bind("tab")} label={strings.status} />
          <DateRangePicker
            from={range.from} to={range.to} onChange={setRange}
            label={strings.window} displayValue={dateDisplay} presets={props.datePresets}
            locale={locale === "ar" ? "ar" : "en"}
            monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
            strings={dateStrings}
          />
          <Button variant="tertiary" expanded={open} controls="visit-advanced-filters" onClick={() => setOpen(value => !value)}>
            {moreLabel}
          </Button>
          <Button type="submit" variant="secondary" label={strings.apply}>{strings.apply}</Button>
        </div>

        <div id="visit-advanced-filters" className={styles.panel} hidden={!open}>
          <Field label={strings.sortLabel}><SaqeelSelect options={props.sortOptions} value={selection.sort} onChange={bind("sort")} label={strings.sortLabel} /></Field>
          <Field label={strings.type}><SaqeelSelect options={props.visitTypeOptions} value={selection.visitType} onChange={bind("visitType")} label={strings.type} /></Field>
          <Field label={strings.mode}><SaqeelSelect options={props.modeOptions} value={selection.mode} onChange={bind("mode")} label={strings.mode} /></Field>
          <Field label={strings.region}><SaqeelSelect options={props.regionOptions} value={selection.region} onChange={bind("region")} label={strings.region} /></Field>
          <Field label={strings.city}><SaqeelSelect options={props.cityOptions} value={selection.city} onChange={bind("city")} label={strings.city} /></Field>
        </div>
      </form>

      {chips.length > 0 ? (
        <div className={styles.chips} aria-label={strings.activeFilters}>
          {chips.map(chip => (
            <a key={chip.key} className={styles.chip} href={chip.href} aria-label={`${strings.removeFilter} ${chip.label}`}>
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </a>
          ))}
          <Button variant="tertiary" href={props.clearHref}>{strings.clearAll}</Button>
        </div>
      ) : null}
    </section>
  );
}
