import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import { adminDelegationMessages } from "@/features/admin-delegation/strings";
import { DELEGATION_VIEWS, type DelegationView, type DelegationViewKey } from "@/features/admin-delegation/types";
import type { Locale } from "@/lib/i18n";
import DelegationCards from "./delegation-cards";
import DelegationCreateForm from "./delegation-create-form";
import DelegationHistoryTable from "./delegation-history-table";
import styles from "./delegation.module.css";

export default function DelegationScreen({ view, data, locale }: {
  view: DelegationViewKey;
  data: DelegationView;
  locale: Locale;
}) {
  const strings = adminDelegationMessages(locale);
  const tabItems: readonly SegmentedItem<DelegationViewKey>[] = DELEGATION_VIEWS.map(key => ({
    value: key,
    label: strings.tabs[key],
    href: `/admin/delegation?view=${key}`,
  }));
  const now = Date.now();

  const unavailable = (
    <Card as="section" role="alert">
      <CardBody>
        <EmptyState
          icon="access"
          tone="danger"
          title={strings.unavailable.title}
          description={strings.unavailable.body}
          action={<Button href={`/admin/delegation?view=${view}`} variant="tertiary">{strings.unavailable.retry}</Button>}
        />
      </CardBody>
    </Card>
  );

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.delegation },
      ]}
      title={strings.title}
    >
      <div className={styles.stack}>
        <SegmentedControl items={tabItems} value={view} label={strings.tabs.label} tone="accent" />

        {view === "new" ? (
          data.availableScopes.length === 0 ? (
            <Card as="section" role="status">
              <CardBody>
                <EmptyState icon="access" title={strings.noScopes.title} description={strings.noScopes.body} />
              </CardBody>
            </Card>
          ) : (
            <DelegationCreateForm delegatorName={data.delegatorName} availableScopes={data.availableScopes} strings={strings} locale={locale} />
          )
        ) : null}

        {view === "active" ? (
          data.readFailed ? unavailable
            : data.activeRows.length === 0 ? (
              <Card as="section" role="status"><CardBody>
                <EmptyState icon="access" title={strings.empty.activeTitle} description={strings.empty.activeBody} />
              </CardBody></Card>
            ) : <DelegationCards rows={data.activeRows} showRevoke locale={locale} strings={strings} />
        ) : null}

        {view === "received" ? (
          data.readFailed ? unavailable
            : data.receivedRows.length === 0 ? (
              <Card as="section" role="status"><CardBody>
                <EmptyState icon="access" title={strings.empty.receivedTitle} description={strings.empty.receivedBody} />
              </CardBody></Card>
            ) : <DelegationCards rows={data.receivedRows} showRevoke={false} locale={locale} strings={strings} />
        ) : null}

        {view === "history" ? (
          data.readFailed ? unavailable
            : <Card as="section"><CardBody>
                <DelegationHistoryTable rows={data.historyRows} now={now} locale={locale} strings={strings} />
              </CardBody></Card>
        ) : null}
      </div>
    </ShellPageFrame>
  );
}
