import type { ReactNode } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import GovernanceNote from "@/components/saqeel/governance-note/governance-note";
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
      actions={<GovernanceNote label={strings.governance.heading} lines={[strings.governance.immutable, strings.governance.validate, strings.governance.maker, strings.governance.runtime]} />}
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
      <Text role="label" tone="muted">
        {fill(strings.toolbar.readAt, { time: formatDateTime(readAt, locale) })}
      </Text>
    </ShellPageFrame>
  );
}
