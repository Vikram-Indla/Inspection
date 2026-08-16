import Link from "next/link";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import { Text } from "@/components/saqeel/type";
import { formatCount } from "@/i18n/numbers";
import type { AdminLocalizationMessages } from "@/features/admin-localization/strings";
import {
  localizationHref,
  type LocalizationFilter,
  type LocalizationQuery,
  type StateCounts,
} from "@/features/admin-localization/view";
import type { Locale } from "@/lib/i18n";
import styles from "./localization-filters.module.css";

const ORDER: readonly LocalizationFilter[] = ["all", "missing", "draft", "reviewed", "orphaned"];

export default function LocalizationFilters({ counts, query, strings, locale }: {
  counts: StateCounts;
  query: LocalizationQuery;
  strings: AdminLocalizationMessages;
  locale: Locale;
}) {
  return (
    <nav aria-label={strings.filters.label}>
      <ul className={styles.tabs}>
        {ORDER.map(filter => (
          <li key={filter}>
            <Link
              aria-current={query.filter === filter ? "page" : undefined}
              className={styles.tab}
              href={localizationHref({ filter, search: query.search })}
              prefetch={false}
            >
              <Text as="span" role="bodyStrong" tone="inherit">{strings.filters[filter]}</Text>
              <CountBadge value={formatCount(counts[filter], locale)} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
