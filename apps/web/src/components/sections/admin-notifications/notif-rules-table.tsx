"use client";

import { Card, CardBody } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { channelLabel, eventLabel, type AdminNotificationsMessages } from "@/features/admin-notifications/strings";
import type { NotificationRuleRow } from "@/features/admin-notifications/types";
import NotifRowActions from "./notif-row-actions";

function statusTone(status: string): StatusTone {
  if (status === "published") return "success";
  if (status === "deactivated") return "danger";
  return "warning";
}

export default function NotifRulesTable({ rules, canWrite, strings }: {
  rules: readonly NotificationRuleRow[];
  canWrite: boolean;
  strings: AdminNotificationsMessages;
}) {
  const t = strings.table;
  const statusLabel = (status: string) =>
    status === "published" ? strings.status.published : status === "deactivated" ? strings.status.deactivated : strings.status.draft;

  const baseColumns: readonly DataColumn<NotificationRuleRow>[] = [
    { key: "event", header: t.event, isRowHeader: true, cell: row => <Text as="span" role="bodyStrong">{eventLabel(row.event_key, strings)}</Text> },
    { key: "channel", header: t.channel, cell: row => <Text as="span">{channelLabel(row.channel, strings)}</Text> },
    { key: "recipient", header: t.recipient, cell: row => row.recipient_role
      ? <Text as="span">{row.recipient_role}</Text>
      : <StatusPill tone="warning">{strings.missingRecipient}</StatusPill> },
    { key: "sla", header: t.sla, cell: row => row.sla_minutes
      ? <Text as="span" role="mono" dir="ltr">{`${row.sla_minutes}m → ${row.escalation_role}`}</Text>
      : <Text as="span" tone="muted">{strings.dash}</Text> },
    { key: "status", header: t.status, cell: row => <StatusPill tone={statusTone(row.status)}>{statusLabel(row.status)}</StatusPill> },
    { key: "version", header: t.version, cell: row => <Text as="span" role="mono" tone="muted">{row.version_label}</Text> },
  ];

  const actionsColumn: DataColumn<NotificationRuleRow> = {
    key: "actions",
    header: t.actions,
    cell: row => <NotifRowActions row={row} strings={strings} />,
  };

  const columns = canWrite ? [...baseColumns, actionsColumn] : baseColumns;

  return (
    <Card as="section">
      <CardBody>
        <DataTable
          columns={columns}
          rows={rules}
          getRowId={row => row.id}
          empty={{ icon: "notify", title: strings.empty.title, description: strings.empty.body }}
          bleed={false}
        />
      </CardBody>
    </Card>
  );
}
