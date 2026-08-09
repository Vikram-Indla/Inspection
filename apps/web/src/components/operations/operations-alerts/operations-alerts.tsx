import { type ReactNode } from "react";
import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type AlertRow = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly meta?: string;
  readonly status?: { readonly label: string; readonly tone: StatusTone };
  readonly action?: ReactNode;
};

export type AlertsStrings = {
  readonly title: string;
  readonly description: string;
  readonly actionsHeading: string;
  readonly actionsEmpty: string;
  readonly notificationsHeading: string;
  readonly notificationsEmpty: string;
  readonly emptyTitle: string;
};

export const DELIVERY_TONE: Readonly<Record<string, StatusTone>> = {
  queued: "warning",
  sent: "info",
  delivered: "info",
  handled: "success",
  failed: "danger",
};

function AlertColumn({ id, heading, rows, empty }: {
  id: string;
  heading: string;
  rows: readonly AlertRow[];
  empty: string;
}) {
  return (

    <Card as="div" labelledBy={id}>
      <CardHeader level="h3" titleId={id} title={heading} />
      <CardBody>
        {rows.length ? (
          <ListRows labelledBy={id}>
            {rows.map(row => (
              <ListRow
                key={row.id}
                title={row.title}
                description={row.description}
                meta={row.meta}
                trailing={
                  row.status || row.action ? (
                    <>
                      {row.status
                        ? <StatusPill tone={row.status.tone}>{row.status.label}</StatusPill>
                        : null}
                      {row.action}
                    </>
                  ) : undefined
                }
              />
            ))}
          </ListRows>
        ) : (
          <EmptyState title={empty} size="sm" />
        )}
      </CardBody>
    </Card>
  );
}

export default function OperationsAlerts({ actions, notifications, strings }: {
  actions: readonly AlertRow[];
  notifications: readonly AlertRow[];
  strings: AlertsStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-alerts">
      <CardHeader
        level="h2"
        titleId="operations-alerts"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        {actions.length === 0 && notifications.length === 0 ? (
          <EmptyState icon="selected" title={strings.emptyTitle} />
        ) : (
          <CardGrid min="lg">
            <AlertColumn
              id="operations-alerts-actions"
              heading={strings.actionsHeading}
              rows={actions}
              empty={strings.actionsEmpty}
            />
            <AlertColumn
              id="operations-alerts-notifications"
              heading={strings.notificationsHeading}
              rows={notifications}
              empty={strings.notificationsEmpty}
            />
          </CardGrid>
        )}
      </CardBody>
    </Card>
  );
}
