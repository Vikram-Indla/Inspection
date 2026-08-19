import { type ReactNode } from "react";
import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import { enforcementRecommendationsMessages } from "@/features/admin-enforcement-recommendations/strings";
import type { EnforcementView } from "@/features/admin-enforcement-recommendations/types";
import type { Locale } from "@/lib/i18n";
import EnforcementDecidedTable from "./enforcement-decided-table";
import EnforcementPendingList from "./enforcement-pending-list";
import styles from "./enforcement-recs.module.css";

export default function EnforcementRecsScreen({ data, locale }: { data: EnforcementView; locale: Locale }) {
  const strings = enforcementRecommendationsMessages(locale);

  const frame = (children: ReactNode) => (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.recommendations },
      ]}
      title={strings.title}
    >
      {children}
    </ShellPageFrame>
  );

  if (data.roleError) {
    return frame(
      <EmptyState icon="restricted" tone="danger" title={strings.permissionsUnavailable.title} description={strings.permissionsUnavailable.body} />,
    );
  }
  if (!data.isReader) {
    return frame(
      <EmptyState icon="restricted" tone="warning" title={strings.unauthorized.title} description={strings.unauthorized.body} />,
    );
  }

  return frame(
    <div className={styles.stack}>
      <div className={styles.notices}>
        <Card as="section" role="alert">
          <CardHeader level="h2" title={strings.config.title} />
          <CardBody><Text tone="secondary">{strings.config.body}</Text></CardBody>
        </Card>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.scope.title} />
          <CardBody><Text tone="secondary">{strings.scope.body}</Text></CardBody>
        </Card>
        {!data.isDecider ? (
          <Card as="section" role="note">
            <CardHeader level="h2" title={strings.readonly.title} />
            <CardBody><Text tone="secondary">{strings.readonly.body}</Text></CardBody>
          </Card>
        ) : null}
        {data.pendingError && (
          <Card as="section" role="alert"><CardBody><Text tone="warning">{strings.loadError}</Text></CardBody></Card>
        )}
      </div>

      <Card as="section">
        <CardHeader level="h2" title={strings.pending} />
        <CardBody>
          {data.pendingError
            ? null
            : <EnforcementPendingList pending={data.pending} canDecide={data.canDecide} strings={strings} locale={locale} />}
        </CardBody>
      </Card>

      {data.isDecider ? (
        <Card as="section">
          <CardHeader level="h2" title={strings.recent} />
          <CardBody>
            {data.decidedError
              ? <Text tone="warning">{strings.decidedLoadError}</Text>
              : <EnforcementDecidedTable decided={data.decided} strings={strings} locale={locale} />}
          </CardBody>
        </Card>
      ) : null}
    </div>,
  );
}
