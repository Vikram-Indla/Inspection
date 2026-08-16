import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import type { RoleRow } from "@/features/admin-access/view";
import styles from "./access-catalogue.module.css";

export default function AccessCatalogue({ roles, strings }: {
  roles: readonly RoleRow[];
  strings: AdminAccessMessages;
}) {
  return (
    <Card>
      <CardHeader level="h2" title={strings.catalogue.title} description={strings.catalogue.body} />
      <CardBody>
        {roles.length ? (
          <ul className={styles.grid}>
            {roles.map(role => (
              <li className={styles.role} key={role.role_key}>
                <Text as="span" role="bodyStrong">{role.title || role.role_key}</Text>
                <StatusPill ping={false} tone={role.is_admin ? "accent" : "neutral"}>
                  {role.is_admin ? strings.roster.adminRole : strings.roster.standardRole}
                </StatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            description={strings.catalogue.emptyBody}
            icon="restricted"
            size="sm"
            title={strings.catalogue.emptyTitle}
          />
        )}
      </CardBody>
    </Card>
  );
}
