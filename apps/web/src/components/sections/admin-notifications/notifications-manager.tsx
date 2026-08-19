import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import type { AdminNotificationsMessages } from "@/features/admin-notifications/strings";
import type { NotificationRuleRow, RoleOption } from "@/features/admin-notifications/types";
import NotifCreateForm from "./notif-create-form";
import NotifRulesTable from "./notif-rules-table";
import styles from "./notifications.module.css";

export default function NotificationsManager({ rules, roles, rolesAvailable, strings }: {
  rules: readonly NotificationRuleRow[];
  roles: readonly RoleOption[];
  rolesAvailable: boolean;
  strings: AdminNotificationsMessages;
}) {
  return (
    <div className={styles.stack}>
      <Card as="section">
        <CardHeader level="h2" title={strings.form.createTitle} />
        <CardBody>
          <NotifCreateForm roles={roles} rolesAvailable={rolesAvailable} strings={strings} />
        </CardBody>
      </Card>
      <NotifRulesTable rules={rules} canWrite strings={strings} />
    </div>
  );
}
