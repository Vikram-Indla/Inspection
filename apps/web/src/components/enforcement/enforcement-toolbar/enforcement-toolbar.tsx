import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import type { EnforcementFilters } from "@/features/enforcement/types";
import styles from "./enforcement-toolbar.module.css";

export type EnforcementToolbarStrings = {
  readonly label: string;
  readonly search: string;
  readonly searchLabel: string;
  readonly status: string;
  readonly allStatuses: string;
  readonly dateRange: string;
  readonly anyDate: string;
  readonly last30: string;
  readonly last90: string;
  readonly lastYear: string;
  readonly region: string;
  readonly allRegions: string;
  readonly apply: string;
  readonly export: string;
};

export default function EnforcementToolbar({ filters, statuses, statusLabel, regions, exportHref, strings }: {
  filters: EnforcementFilters;
  statuses: readonly string[];
  statusLabel: (value: string) => string;
  regions: readonly string[];
  exportHref: string;
  strings: EnforcementToolbarStrings;
}) {
  return (
    <form className={styles.root} method="get" action="/enforcement-library" aria-label={strings.label}>
      <span className={styles.search}>
        <Icon name="search" size="md" />
        <input
          className={styles.input}
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder={strings.search}
          aria-label={strings.searchLabel}
        />
      </span>
      <select className={styles.chip} name="status" defaultValue={filters.status} aria-label={strings.status}>
        <option value="">{strings.allStatuses}</option>
        {statuses.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}
      </select>
      <select className={styles.chip} name="range" defaultValue={filters.range || ""} aria-label={strings.dateRange}>
        <option value="">{strings.anyDate}</option>
        <option value="30">{strings.last30}</option>
        <option value="90">{strings.last90}</option>
        <option value="365">{strings.lastYear}</option>
      </select>
      <select className={styles.chip} name="region" defaultValue={filters.region} aria-label={strings.region}>
        <option value="">{strings.allRegions}</option>
        {regions.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
      <Button type="submit" variant="primary" size="sm">{strings.apply}</Button>
      <span className={styles.grow} aria-hidden="true"></span>
      <Button href={exportHref} variant="secondary" size="sm">{strings.export}</Button>
    </form>
  );
}
