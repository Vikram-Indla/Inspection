import { useId, useRef, useState } from "react";
import Icon from "@/components/saqeel/icon/icon";
import Field from "@/components/saqeel/field/field";
import MenuSurface from "@/components/saqeel/menu-surface/menu-surface";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import DatePicker from "@/components/saqeel/date-picker/date-picker";
import type { Locale } from "@/lib/i18n";
import styles from "./planning-toolbar.module.css";

export type MoreFiltersStrings = {
  moreFilters: string;
  method: string;
  region: string;
  city: string;
  windowFrom: string;
  windowTo: string;
  sortLabel: string;
  datePlaceholder: string;
  dateClear: string;
  dateToday: string;
  monthPrevious: string;
  monthNext: string;
};

export type MoreFiltersValues = {
  method: string;
  region: string;
  city: string;
  windowFrom: string;
  windowTo: string;
  sort: string;
};

export default function MoreFilters({ strings, options, values, onChange, locale }: {
  strings: MoreFiltersStrings;
  options: {
    methods: readonly SelectOption[];
    regions: readonly SelectOption[];
    cities: readonly SelectOption[];
    sortKeys: readonly SelectOption[];
  };
  values: MoreFiltersValues;
  onChange: (patch: Partial<MoreFiltersValues>) => void;
  locale: Locale;
}) {
  const panelId = useId();
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
        onClick={() => setIsOpen(open => !open)}
      >
        {strings.moreFilters}
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
          <Field label={strings.method}>
            <SaqeelSelect
              options={options.methods}
              value={values.method}
              onChange={method => onChange({ method })}
              label={strings.method}
            />
          </Field>
          <Field label={strings.region}>
            <SaqeelSelect
              options={options.regions}
              value={values.region}
              onChange={region => onChange({ region, city: "" })}
              label={strings.region}
            />
          </Field>
          <Field label={strings.city}>
            <SaqeelSelect
              options={options.cities}
              value={values.city}
              onChange={city => onChange({ city })}
              label={strings.city}
            />
          </Field>
          <Field label={strings.sortLabel}>
            <SaqeelSelect
              options={options.sortKeys}
              value={values.sort}
              onChange={sort => onChange({ sort })}
              label={strings.sortLabel}
            />
          </Field>
          <Field label={strings.windowFrom}>
            <DatePicker
              value={values.windowFrom}
              onChange={windowFrom => onChange({ windowFrom })}
              label={strings.windowFrom}
              placeholder={strings.datePlaceholder}
              locale={dateLocale}
              monthLabels={monthLabels}
              strings={dateStrings}
            />
          </Field>
          <Field label={strings.windowTo}>
            <DatePicker
              value={values.windowTo}
              onChange={windowTo => onChange({ windowTo })}
              label={strings.windowTo}
              placeholder={strings.datePlaceholder}
              locale={dateLocale}
              monthLabels={monthLabels}
              strings={dateStrings}
            />
          </Field>
        </div>
      </MenuSurface>
    </>
  );
}
