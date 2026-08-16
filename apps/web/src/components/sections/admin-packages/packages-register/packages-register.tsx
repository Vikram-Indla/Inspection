import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import type { PackagesData } from "@/features/admin-packages/queries";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import type { PackagesQuery, VersionRow } from "@/features/admin-packages/view";
import type { Locale } from "@/lib/i18n";
import PackageCard from "../package-card/package-card";
import styles from "./packages-register.module.css";

export default function PackagesRegister({ data, query, strings, locale, impactFor, editorFor }: {
  data: PackagesData;
  query: PackagesQuery;
  strings: AdminPackagesMessages;
  locale: Locale;
  impactFor: (version: VersionRow) => ReactNode;
  editorFor: (version: VersionRow) => ReactNode;
}) {
  if (!data.packages.length) {
    const filtered = query.search !== "" || query.filter !== "all";
    return (
      <Card>
        <CardBody>
          <EmptyState
            description={filtered
              ? strings.register.emptyBody
              : data.canWrite ? strings.register.noneBodyWriter : strings.register.noneBody}
            icon="forms"
            title={filtered ? strings.register.emptyTitle : strings.register.noneTitle}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={styles.register}>
      {data.packages.map(pkg => (
        <PackageCard
          editorFor={editorFor}
          impactFor={impactFor}
          key={pkg.id}
          locale={locale}
          pkg={pkg}
          strings={strings}
          today={data.today}
        />
      ))}
    </div>
  );
}
