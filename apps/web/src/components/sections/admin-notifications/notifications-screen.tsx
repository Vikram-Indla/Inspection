import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import { adminNotificationsMessages } from "@/features/admin-notifications/strings";
import type { NotificationsView } from "@/features/admin-notifications/types";
import type { Locale } from "@/lib/i18n";
import NotificationsManager from "./notifications-manager";
import NotifRulesTable from "./notif-rules-table";
import styles from "./notifications.module.css";

export default function NotificationsScreen({ data, locale }: { data: NotificationsView; locale: Locale }) {
  const strings = adminNotificationsMessages(locale);
  const rules = data.rulesFailed ? [] : data.rules;

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      title={strings.title}
    >
      <div className={styles.stack}>
        {data.rulesFailed ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={strings.degraded.title} />
            <CardBody><Text tone="secondary">{strings.degraded.body}</Text></CardBody>
          </Card>
        ) : null}

        {!data.rolesAvailable ? (
          <Card as="section" role="alert"><CardBody><Text tone="warning">{strings.rolesUnavailable}</Text></CardBody></Card>
        ) : null}

        {data.permissionsFailed ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={strings.permissionsUnavailable.title} />
            <CardBody><Text tone="secondary">{strings.permissionsUnavailable.body}</Text></CardBody>
          </Card>
        ) : !data.isWriter ? (
          <Card as="section" role="note">
            <CardHeader level="h2" title={strings.readonly.title} />
            <CardBody><Text tone="secondary">{strings.readonly.body}</Text></CardBody>
          </Card>
        ) : null}

        {data.isWriter ? (
          <NotificationsManager rules={rules} roles={data.roles} rolesAvailable={data.rolesAvailable} strings={strings} />
        ) : (
          <NotifRulesTable rules={rules} canWrite={false} strings={strings} />
        )}

        <Text role="label" tone="muted">{strings.escalationNote}</Text>
      </div>
    </ShellPageFrame>
  );
}
