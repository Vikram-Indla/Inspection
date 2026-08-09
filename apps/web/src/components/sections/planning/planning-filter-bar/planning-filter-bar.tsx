"use client";
import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import DateRangePicker, { type DateRangePreset } from "@/components/saqeel/date-range-picker/date-range-picker";
import DatePicker from "@/components/saqeel/date-picker/date-picker";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { formatDateRange } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import styles from "./planning-filter-bar.module.css";

export type PlanningFilterChip = { readonly key: string; readonly label: string; readonly href: string };

type SelectState = {
  status: string;
  inspector: string;
  sort: string;
  method: string;
  visitType: string;
  priority: string;
  region: string;
  city: string;
  reportPackage: string;
};

export type PlanningFilterBarProps = {
  locale: Locale;
  action: string;
  strings: {
    readonly aria: string; readonly searchLabel: string; readonly searchPlaceholder: string;
    readonly status: string; readonly allInspectors: string; readonly visitDate: string;
    readonly visitDateEmpty: string; readonly datePresets: string; readonly filters: string;
    readonly apply: string; readonly clearAll: string; readonly activeFilters: string;
    readonly removeFilter: string; readonly sortLabel: string; readonly method: string;
    readonly visitType: string; readonly priority: string; readonly region: string;
    readonly city: string; readonly reportPackage: string; readonly createdFrom: string;
    readonly createdTo: string; readonly clear: string; readonly presetToday: string; readonly bulkPlanRef: string; readonly from: string;
    readonly to: string; readonly pickStart: string; readonly pickEnd: string;
    readonly reset: string; readonly empty: string; readonly previousMonth: string; readonly nextMonth: string;
  };
  search: string;
  status: string;
  statusOptions: readonly SelectOption[];
  inspector: string;
  inspectorOptions: readonly SelectOption[];
  windowFrom: string;
  windowTo: string;
  datePresets: readonly DateRangePreset[];
  sort: string;
  sortOptions: readonly SelectOption[];
  method: string;
  methodOptions: readonly SelectOption[];
  visitType: string;
  visitTypeOptions: readonly SelectOption[];
  priority: string;
  priorityOptions: readonly SelectOption[];
  region: string;
  regionOptions: readonly SelectOption[];
  city: string;
  cityOptions: readonly SelectOption[];
  reportPackage: string;
  packageOptions: readonly SelectOption[];
  createdFrom: string;
  createdTo: string;
  bulkPlanRef: string;
  advancedCount: number;
  chips: readonly PlanningFilterChip[];
  clearHref: string;
};

export default function PlanningFilterBar(props: PlanningFilterBarProps) {
  const { locale, action, strings, chips } = props;
  const [sel, setSel] = useState<SelectState>({
    status: props.status, inspector: props.inspector, sort: props.sort, method: props.method,
    visitType: props.visitType, priority: props.priority, region: props.region, city: props.city,
    reportPackage: props.reportPackage,
  });
  const [range, setRange] = useState({ from: props.windowFrom, to: props.windowTo });
  const [createdFrom, setCreatedFrom] = useState(props.createdFrom);
  const [createdTo, setCreatedTo] = useState(props.createdTo);
  const [open, setOpen] = useState(false);
  const bind = (key: keyof SelectState) => (value: string) => setSel(prev => ({ ...prev, [key]: value }));
  const dateStrings = {
    from: strings.from, to: strings.to, pickStart: strings.pickStart, pickEnd: strings.pickEnd,
    reset: strings.reset, apply: strings.apply, empty: strings.empty,
  };
  const dateDisplay = range.from || range.to ? formatDateRange(range.from, range.to, locale) : strings.visitDateEmpty;
  const filtersLabel = props.advancedCount > 0 ? `${strings.filters} (${props.advancedCount})` : strings.filters;

  return (
    <section className={styles.shell} aria-label={strings.aria}>
      <form className={styles.form} method="get" action={action}>
        <input type="hidden" name="tab" value={sel.status} />
        <input type="hidden" name="inspectorId" value={sel.inspector} />
        <input type="hidden" name="sort" value={sel.sort} />
        <input type="hidden" name="method" value={sel.method} />
        <input type="hidden" name="visitType" value={sel.visitType} />
        <input type="hidden" name="priority" value={sel.priority} />
        <input type="hidden" name="region" value={sel.region} />
        <input type="hidden" name="city" value={sel.city} />
        <input type="hidden" name="packageVersionId" value={sel.reportPackage} />
        <input type="hidden" name="windowFrom" value={range.from} />
        <input type="hidden" name="windowTo" value={range.to} />
        <input type="hidden" name="createdFrom" value={createdFrom} />
        <input type="hidden" name="createdTo" value={createdTo} />

        <div className={styles.primary}>
          <input className={styles.search} type="search" name="q" defaultValue={props.search}
            placeholder={strings.searchPlaceholder} aria-label={strings.searchLabel} />
          <SaqeelSelect options={props.statusOptions} value={sel.status} onChange={bind("status")} label={strings.status} />
          <SaqeelSelect options={props.inspectorOptions} value={sel.inspector} onChange={bind("inspector")} label={strings.allInspectors} />
          <DateRangePicker
            from={range.from} to={range.to} onChange={setRange}
            label={strings.visitDate} displayValue={dateDisplay} presets={props.datePresets}
            locale={locale === "ar" ? "ar" : "en"}
            monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
            strings={dateStrings}
          />
          <Button variant="tertiary" expanded={open} controls="planning-advanced-filters" onClick={() => setOpen(value => !value)}>
            {filtersLabel}
          </Button>
          <Button type="submit" variant="secondary" label={strings.apply}>{strings.apply}</Button>
        </div>

        <div id="planning-advanced-filters" className={styles.panel} hidden={!open}>
          <Field label={strings.sortLabel}><SaqeelSelect options={props.sortOptions} value={sel.sort} onChange={bind("sort")} label={strings.sortLabel} /></Field>
          <Field label={strings.method}><SaqeelSelect options={props.methodOptions} value={sel.method} onChange={bind("method")} label={strings.method} /></Field>
          <Field label={strings.visitType}><SaqeelSelect options={props.visitTypeOptions} value={sel.visitType} onChange={bind("visitType")} label={strings.visitType} /></Field>
          <Field label={strings.priority}><SaqeelSelect options={props.priorityOptions} value={sel.priority} onChange={bind("priority")} label={strings.priority} /></Field>
          <Field label={strings.region}><SaqeelSelect options={props.regionOptions} value={sel.region} onChange={bind("region")} label={strings.region} /></Field>
          <Field label={strings.city}><SaqeelSelect options={props.cityOptions} value={sel.city} onChange={bind("city")} label={strings.city} /></Field>
          <Field label={strings.reportPackage}><SaqeelSelect options={props.packageOptions} value={sel.reportPackage} onChange={bind("reportPackage")} label={strings.reportPackage} /></Field>
          <Field label={strings.createdFrom}>
            <DatePicker
              value={createdFrom} onChange={setCreatedFrom} label={strings.createdFrom}
              placeholder={strings.visitDateEmpty} locale={locale === "ar" ? "ar" : "en"}
              monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
              strings={{ clear: strings.clear, today: strings.presetToday }}
            />
          </Field>
          <Field label={strings.createdTo}>
            <DatePicker
              value={createdTo} onChange={setCreatedTo} label={strings.createdTo}
              placeholder={strings.visitDateEmpty} locale={locale === "ar" ? "ar" : "en"}
              monthLabels={{ previous: strings.previousMonth, next: strings.nextMonth }}
              strings={{ clear: strings.clear, today: strings.presetToday }}
            />
          </Field>
          <Field label={strings.bulkPlanRef} htmlFor="planning-bulk-ref"><input id="planning-bulk-ref" className={styles.text} type="text" name="bulkPlanRef" defaultValue={props.bulkPlanRef} placeholder="BP-…" /></Field>
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
