import { useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import Field from "@/components/saqeel/field/field";
import MenuSurface from "@/components/saqeel/menu-surface/menu-surface";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import DatePicker from "@/components/saqeel/date-picker/date-picker";
import { Text } from "@/components/saqeel/type";
import type { Locale } from "@/lib/i18n";
import styles from "./planning-toolbar.module.css";

export type MoreFiltersStrings = {
  moreFilters: string;
  visitType: string;
  priority: string;
  inspector: string;
  method: string;
  region: string;
  city: string;
  windowFrom: string;
  windowTo: string;
  sortLabel: string;
  dateClear: string;
  dateToday: string;
  monthPrevious: string;
  monthNext: string;
};

export type MoreFiltersValues = {
  visitType: string;
  priority: string;
  inspectorId: string;
  method: string;
  region: string;
  city: string;
  windowFrom: string;
  windowTo: string;
  sort: string;
};

export default function MoreFilters({ strings, options, values, onChange, locale, activeCount }: {
  strings: MoreFiltersStrings;
  options: {
    visitTypes: readonly SelectOption[];
    priorities: readonly SelectOption[];
    inspectors: readonly SelectOption[];
    methods: readonly SelectOption[];
    regions: readonly SelectOption[];
    cities: readonly SelectOption[];
    sortKeys: readonly SelectOption[];
  };
  values: MoreFiltersValues;
  onChange: (patch: Partial<MoreFiltersValues>) => void;
  locale: Locale;
  activeCount: number;
}) {
  const panelId = useId();
  const sortId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const monthLabels = { previous: strings.monthPrevious, next: strings.monthNext };
  const dateStrings = { clear: strings.dateClear, today: strings.dateToday };
  const dateLocale = locale === "ar" ? "ar" : "en";

  return (
    <>
      <button
        className={styles.moreTrigger}
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        data-open={isOpen ? "" : undefined}
        data-active={activeCount > 0 ? "" : undefined}
        onClick={() => setIsOpen(open => !open)}
      >
        <Text as="span" role="label" tone="inherit">{strings.moreFilters}</Text>
        {activeCount > 0 ? <CountBadge value={activeCount} /> : null}
        <Icon name="disclosure" size="sm" />
      </button>

      <MenuSurface
        id={panelId}
        open={isOpen}
        onClose={() => { setIsOpen(false); triggerRef.current?.focus(); }}
        triggerRef={triggerRef}
        align="end"
        label={strings.moreFilters}
        role="dialog"
        trapFocus
      >
        <div className={styles.moreGrid}>
          <SaqeelSelect
            options={options.visitTypes}
            value={values.visitType}
            onChange={visitType => onChange({ visitType })}
            label={strings.visitType}
          />
          <SaqeelSelect
            options={options.priorities}
            value={values.priority}
            onChange={priority => onChange({ priority })}
            label={strings.priority}
          />
          <SaqeelSelect
            options={options.inspectors}
            value={values.inspectorId}
            onChange={inspectorId => onChange({ inspectorId })}
            label={strings.inspector}
          />
          <SaqeelSelect
            options={options.methods}
            value={values.method}
            onChange={method => onChange({ method })}
            label={strings.method}
          />
          <SaqeelSelect
            options={options.regions}
            value={values.region}
            onChange={region => onChange({ region, city: "" })}
            label={strings.region}
          />
          <SaqeelSelect
            options={options.cities}
            value={values.city}
            onChange={city => onChange({ city })}
            label={strings.city}
          />
          <DatePicker
            value={values.windowFrom}
            onChange={windowFrom => onChange({ windowFrom })}
            label={strings.windowFrom}
            placeholder={strings.windowFrom}
            locale={dateLocale}
            monthLabels={monthLabels}
            strings={dateStrings}
          />
          <DatePicker
            value={values.windowTo}
            onChange={windowTo => onChange({ windowTo })}
            label={strings.windowTo}
            placeholder={strings.windowTo}
            locale={dateLocale}
            monthLabels={monthLabels}
            strings={dateStrings}
          />
          <Field label={strings.sortLabel} htmlFor={sortId}>
            <SaqeelSelect
              id={sortId}
              options={options.sortKeys}
              value={values.sort}
              onChange={sort => onChange({ sort })}
              label={strings.sortLabel}
            />
          </Field>
        </div>
      </MenuSurface>
    </>
  );
}
