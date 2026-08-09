"use client";
import { useState } from "react";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import styles from "./enforcement-filter-bar.module.css";

export type EnforcementFilterStrings = {
  readonly aria: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly status: string;
  readonly range: string;
  readonly region: string;
  readonly apply: string;
  readonly clear: string;
  readonly export: string;
};

type Selection = { readonly status: string; readonly range: string; readonly region: string };

export default function EnforcementFilterBar({
  action, search, status, range, region, statusOptions, rangeOptions, regionOptions,
  filtered, clearHref, exportHref, strings,
}: {
  action: string;
  search: string;
  status: string;
  range: number;
  region: string;
  statusOptions: readonly SelectOption[];
  rangeOptions: readonly SelectOption[];
  regionOptions: readonly SelectOption[];
  filtered: boolean;
  clearHref: string;
  exportHref: string;
  strings: EnforcementFilterStrings;
}) {
  const [selection, setSelection] = useState<Selection>({
    status,
    range: range ? String(range) : "",
    region,
  });
  const bind = (key: keyof Selection) => (value: string) =>
    setSelection(previous => ({ ...previous, [key]: value }));

  return (
    <form className={styles.bar} action={action} role="search" aria-label={strings.aria}>
      <input type="hidden" name="status" value={selection.status} />
      <input type="hidden" name="range" value={selection.range} />
      <input type="hidden" name="region" value={selection.region} />

      <input
        className={styles.input}
        type="search"
        name="q"
        defaultValue={search}
        placeholder={strings.searchPlaceholder}
        aria-label={strings.searchLabel}
      />

      <Field label={strings.status}>
        <SaqeelSelect options={statusOptions} value={selection.status} onChange={bind("status")} label={strings.status} />
      </Field>
      <Field label={strings.range}>
        <SaqeelSelect options={rangeOptions} value={selection.range} onChange={bind("range")} label={strings.range} />
      </Field>
      <Field label={strings.region}>
        <SaqeelSelect options={regionOptions} value={selection.region} onChange={bind("region")} label={strings.region} />
      </Field>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="sm" label={strings.apply}>{strings.apply}</Button>
        {filtered ? <Button variant="link" size="sm" href={clearHref} label={strings.clear}>{strings.clear}</Button> : null}
        <Button variant="secondary" size="sm" href={exportHref} label={strings.export}>{strings.export}</Button>
      </div>
    </form>
  );
}
