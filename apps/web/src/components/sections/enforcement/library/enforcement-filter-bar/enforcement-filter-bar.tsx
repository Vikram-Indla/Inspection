import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import { ENFORCEMENT_RANGES } from "@/features/enforcement/params";
import { fill } from "@/i18n/messages";
import styles from "./enforcement-filter-bar.module.css";

export type EnforcementFilterStrings = {
  readonly aria: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly status: string;
  readonly anyStatus: string;
  readonly range: string;
  readonly anyDate: string;
  readonly lastDays: string;
  readonly lastYear: string;
  readonly region: string;
  readonly anyRegion: string;
  readonly apply: string;
  readonly clear: string;
  readonly export: string;
};

const YEAR_DAYS = 365;

export default function EnforcementFilterBar({
  action, search, status, range, region, statuses, regions, filtered, clearHref, exportHref, labelFor, strings,
}: {
  action: string;
  search: string;
  status: string;
  range: number;
  region: string;
  statuses: readonly string[];
  regions: readonly string[];
  filtered: boolean;
  clearHref: string;
  exportHref: string;
  labelFor: (value: string) => string;
  strings: EnforcementFilterStrings;
}) {
  return (
    <form className={styles.bar} action={action} role="search" aria-label={strings.aria}>
      <input
        className={styles.input}
        type="search"
        name="q"
        defaultValue={search}
        placeholder={strings.searchPlaceholder}
        aria-label={strings.searchLabel}
      />

      <Field label={strings.status} htmlFor="enforcement-status">
        <select className={styles.select} id="enforcement-status" name="status" defaultValue={status}>
          <option value="">{strings.anyStatus}</option>
          {statuses.map(value => <option key={value} value={value}>{labelFor(value)}</option>)}
        </select>
      </Field>

      <Field label={strings.range} htmlFor="enforcement-range">
        <select className={styles.select} id="enforcement-range" name="range" defaultValue={range || ""}>
          <option value="">{strings.anyDate}</option>
          {ENFORCEMENT_RANGES.map(days => (
            <option key={days} value={days}>
              {days === YEAR_DAYS ? strings.lastYear : fill(strings.lastDays, { days })}
            </option>
          ))}
        </select>
      </Field>

      <Field label={strings.region} htmlFor="enforcement-region">
        <select className={styles.select} id="enforcement-region" name="region" defaultValue={region}>
          <option value="">{strings.anyRegion}</option>
          {regions.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </Field>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="sm" label={strings.apply}>{strings.apply}</Button>
        {filtered ? <Button variant="link" size="sm" href={clearHref} label={strings.clear}>{strings.clear}</Button> : null}
        <Button variant="secondary" size="sm" href={exportHref} label={strings.export}>{strings.export}</Button>
      </div>
    </form>
  );
}
