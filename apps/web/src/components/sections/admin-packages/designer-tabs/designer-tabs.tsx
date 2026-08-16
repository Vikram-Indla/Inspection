import Link from "next/link";
import { Text } from "@/components/saqeel/type";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import { packagesHref, type PackagesQuery, type PackagesTab } from "@/features/admin-packages/view";
import styles from "./designer-tabs.module.css";

export default function DesignerTabs({ tabs, active, query, versionId, strings }: {
  tabs: readonly PackagesTab[];
  active: PackagesTab;
  query: PackagesQuery;
  versionId: string;
  strings: AdminPackagesMessages;
}) {
  return (
    <nav aria-label={strings.workbench.tabsLabel}>
      <ul className={styles.tabs}>
        {tabs.map(tab => (
          <li key={tab}>
            <Link
              aria-current={active === tab ? "page" : undefined}
              className={styles.tab}
              href={packagesHref({ ...query, versionId, tab })}
              prefetch={false}
            >
              <Text as="span" role="bodyStrong" tone="inherit">{strings.workbench[tab]}</Text>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
