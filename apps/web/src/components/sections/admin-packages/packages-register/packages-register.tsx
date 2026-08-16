import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRows } from "@/components/saqeel/list-row/list-row";
import type { PackagesData } from "@/features/admin-packages/queries";
import type { AdminPackagesMessages } from "@/features/admin-packages/strings";
import type { PackagesQuery } from "@/features/admin-packages/view";
import type { Locale } from "@/lib/i18n";
import PackageRow from "../package-row/package-row";

export default function PackagesRegister({ data, query, strings, locale }: {
  data: PackagesData;
  query: PackagesQuery;
  strings: AdminPackagesMessages;
  locale: Locale;
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
    <Card>
      <CardBody gap="tight">
        <ListRows label={strings.register.listLabel}>
          {data.packages.map(pkg => (
            <PackageRow
              key={pkg.id}
              locale={locale}
              pkg={pkg}
              query={query}
              strings={strings}
              today={data.today}
            />
          ))}
        </ListRows>
      </CardBody>
    </Card>
  );
}
