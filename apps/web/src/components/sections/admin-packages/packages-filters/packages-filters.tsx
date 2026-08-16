import Link from "next/link";
import CountBadge from "@/components/saqeel/count-badge/count-badge";
import { Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import {
  packagesHref,
  type PackageCounts,
  type PackageFilter,
  type PackagesQuery,
} from "@/features/admin-packages/view";
import { formatCount } from "@/i18n/numbers";
import type { Locale } from "@/lib/i18n";
import styles from "./packages-filters.module.css";

const ORDER: readonly PackageFilter[] = ["all", "published", "draft", "empty"];

export default function PackagesFilters({ counts, query, strings, locale }: {
  counts: PackageCounts;
  query: PackagesQuery;
  strings: AdminPackagesMessages;
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
              href={packagesHref({ filter, search: query.search })}
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
