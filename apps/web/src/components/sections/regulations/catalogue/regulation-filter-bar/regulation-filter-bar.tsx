import Link from "next/link";
import Button from "@/components/saqeel/button/button";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import type { RegulationStatusCount } from "@/features/regulations/rows";
import styles from "./regulation-filter-bar.module.css";

export type RegulationFilterStrings = {
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly apply: string;
  readonly statusLegend: string;
  readonly clear: string;
};

export default function RegulationFilterBar({
  action, search, authority, status, counts, hrefFor, clearHref, filtered, labelFor, strings,
}: {
  action: string;
  search: string;
  authority: string;
  status: string;
  counts: readonly RegulationStatusCount[];
  hrefFor: (status: string) => string;
  clearHref: string;
  filtered: boolean;
  labelFor: (status: string) => string;
  strings: RegulationFilterStrings;
}) {
  return (
    <div className={styles.bar}>
      <form className={styles.search} action={action} role="search">
        {authority ? <input type="hidden" name="authority" value={authority} /> : null}
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input
          className={styles.input}
          type="search"
          name="q"
          defaultValue={search}
          placeholder={strings.searchPlaceholder}
          aria-label={strings.searchLabel}
        />
        <Button type="submit" variant="secondary" size="sm" label={strings.apply}>{strings.apply}</Button>
      </form>

      <nav className={styles.chips} aria-label={strings.statusLegend}>
        {counts.map(entry => (
          <Link
            className={styles.chip}
            key={entry.key || "all"}
            href={hrefFor(entry.key)}
            aria-current={status === entry.key ? "true" : undefined}
          >
            {labelFor(entry.key)}
            <CountBadge tone="neutral" superscript value={entry.count} />
          </Link>
        ))}
      </nav>

      {filtered ? (
        <Button variant="link" size="sm" href={clearHref} label={strings.clear}>{strings.clear}</Button>
      ) : null}
    </div>
  );
}
