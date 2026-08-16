import type { ReactNode } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import type { PackagesData } from "@/features/admin-packages/queries";
import { adminPackagesMessages } from "@/features/admin-packages/strings";
import type { PackagesQuery, VersionRow } from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import PackagesFilters from "../packages-filters/packages-filters";
import PackagesRegister from "../packages-register/packages-register";
import PackagesToolbar from "../packages-toolbar/packages-toolbar";
import styles from "./packages-screen.module.css";

export default function PackagesScreen({ data, query, locale, readAt, newPackageForm, impactFor, editorFor }: {
  data: PackagesData;
  query: PackagesQuery;
  locale: Locale;
  readAt: number;
  newPackageForm: ReactNode;
  impactFor: (version: VersionRow) => ReactNode;
  editorFor: (version: VersionRow) => ReactNode;
}) {
  const strings = adminPackagesMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      description={strings.subtitle}
      title={strings.title}
    >
      <PackagesFilters counts={data.counts} locale={locale} query={query} strings={strings} />

      <PackagesToolbar
        actions={data.canWrite ? newPackageForm : null}
        canWrite={data.canWrite}
        locale={locale}
        matched={data.packages.length}
        query={query}
        strings={strings}
        total={data.counts.all}
      />

      {data.permissionUnknown ? (
        <EmptyState
          description={strings.notices.permissionUnknownBody}
          icon="risk"
          title={strings.notices.permissionUnknownTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      {!data.canWrite && !data.permissionUnknown ? (
        <EmptyState
          description={strings.notices.readOnlyBody}
          icon="restricted"
          title={strings.notices.readOnlyTitle}
          tone="info"
          variant="inline"
        />
      ) : null}

      {data.itemBankUnavailable ? (
        <EmptyState
          description={strings.notices.itemBankBody}
          icon="risk"
          title={strings.notices.itemBankTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      {data.templatesUnavailable ? (
        <EmptyState
          description={strings.notices.templatesBody}
          icon="risk"
          title={strings.notices.templatesTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      <PackagesRegister
        data={data}
        editorFor={editorFor}
        impactFor={impactFor}
        locale={locale}
        query={query}
        strings={strings}
      />

      <Card>
        <CardHeader level="h2" title={strings.governance.heading} />
        <CardBody>
          <ul className={styles.governance}>
            <li><Text as="span" tone="secondary">{strings.governance.immutable}</Text></li>
            <li><Text as="span" tone="secondary">{strings.governance.validate}</Text></li>
            <li><Text as="span" tone="secondary">{strings.governance.maker}</Text></li>
            <li><Text as="span" tone="secondary">{strings.governance.runtime}</Text></li>
          </ul>
          <Text role="label" tone="muted">
            {fill(strings.toolbar.readAt, { time: formatDateTime(readAt, locale) })}
          </Text>
        </CardBody>
      </Card>
    </ShellPageFrame>
  );
}
