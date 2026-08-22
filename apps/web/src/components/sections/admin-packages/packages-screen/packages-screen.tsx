import type { ReactNode } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import type { PackagesData } from "@/features/admin-packages/queries";
import { adminPackagesMessages } from "@/features/admin-packages/strings";
import type { PackagesQuery } from "@/features/admin-packages/view";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import PackagesDisclosure from "../packages-disclosure/packages-disclosure";
import PackagesFilters from "../packages-filters/packages-filters";
import PackagesNotices from "../packages-notices/packages-notices";
import PackagesRegister from "../packages-register/packages-register";
import PackagesToolbar from "../packages-toolbar/packages-toolbar";
import styles from "./packages-screen.module.css";

export default function PackagesScreen({
  data, query, locale, readAt, notFound, newPackageForm, templateRegistry,
}: {
  data: PackagesData;
  query: PackagesQuery;
  locale: Locale;
  readAt: number;
  notFound: boolean;
  newPackageForm: ReactNode;
  templateRegistry: ReactNode;
}) {
  const strings = adminPackagesMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      title={strings.title}
    >
      <PackagesFilters counts={data.counts} locale={locale} query={query} strings={strings} />

      <PackagesToolbar
        canWrite={data.canWrite}
        locale={locale}
        matched={data.packages.length}
        query={query}
        strings={strings}
        total={data.counts.all}
      />

      {notFound ? (
        <EmptyState
          description={strings.workbench.notFoundBody}
          icon="risk"
          title={strings.workbench.notFoundTitle}
          tone="warning"
          variant="inline"
        />
      ) : null}

      <PackagesNotices data={data} strings={strings} />

      {data.canWrite ? (
        <PackagesDisclosure summary={strings.toolbar.newPackage}>{newPackageForm}</PackagesDisclosure>
      ) : null}

      <PackagesRegister data={data} locale={locale} query={query} strings={strings} />

      {templateRegistry ? (
        <PackagesDisclosure hint={strings.templates.hint} summary={strings.templates.summary}>
          {templateRegistry}
        </PackagesDisclosure>
      ) : null}

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
