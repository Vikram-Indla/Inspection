import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import {
  adminDevicesMessages,
  commandStatusLabel,
  commandStatusTone,
  trustLabel,
  trustTone,
} from "@/features/admin-devices/strings";
import type { DeviceRow, DevicesView } from "@/features/admin-devices/types";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import DeviceCommandForm from "./device-command-form";
import styles from "./devices.module.css";

export default function DevicesScreen({ data, locale }: { data: DevicesView; locale: Locale }) {
  const strings = adminDevicesMessages(locale);
  const reg = strings.register;
  const badge = data.devicesError ? strings.registerUnavailable : fill(strings.controlledRows, { count: data.devices.length });

  const columns: readonly DataColumn<DeviceRow>[] = [
    { key: "device", header: reg.device, isRowHeader: true, cell: row => (
      <span className={styles.cellStack}>
        <Text as="span" role="bodyStrong">{row.device_identifier}</Text>
        <Text as="span" tone="muted">{`${row.platform} · ${fill(reg.mdm, { reference: row.mdm_reference ?? reg.unverified })}`}</Text>
      </span>
    ) },
    { key: "assignee", header: reg.assignee, cell: row => <Text as="span" role="mono" dir="ltr">{row.assigned_user_id ?? reg.unassigned}</Text> },
    { key: "status", header: reg.status, cell: row => <StatusPill tone={trustTone(row.trust_status)}>{trustLabel(row.trust_status, locale)}</StatusPill> },
    { key: "lastSeen", header: reg.lastSeen, cell: row => row.last_seen_at
      ? <Text as="span" role="mono" tone="muted" dir="ltr">{formatDateTime(row.last_seen_at, locale)}</Text>
      : <Text as="span" tone="muted">{reg.never}</Text> },
    { key: "action", header: reg.action, cell: row => <DeviceCommandForm deviceId={row.id} strings={strings} /> },
  ];

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[{ label: strings.breadcrumb.administration, href: "/admin" }, { label: strings.breadcrumb.devices }]}
      title={strings.title}
      actions={<StatusPill tone="info">{badge}</StatusPill>}
    >
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.rule.title} />
          <CardBody><Text tone="secondary">{strings.rule.body}</Text></CardBody>
        </Card>

        {data.devicesError ? (
          <Card as="section" role="alert"><CardBody><Text tone="warning">{strings.schemaPending}</Text></CardBody></Card>
        ) : null}

        <Card as="section">
          <CardHeader level="h2" title={reg.title}
            trailing={<StatusPill tone={data.devicesError ? "warning" : "success"}>{data.devicesError ? reg.unavailable : fill(reg.trusted, { count: data.trustedCount })}</StatusPill>} />
          <CardBody>
            <DataTable columns={columns} rows={data.devices} getRowId={row => row.id} empty={{ icon: "identity", title: reg.empty }} bleed={false} />
          </CardBody>
        </Card>

        <Card as="section">
          <CardHeader level="h2" title={strings.evidence.title} />
          <CardBody>
            {data.commandsError ? (
              <Text tone="warning">{strings.evidence.unavailable}</Text>
            ) : data.commands.length === 0 ? (
              <Text tone="muted">{strings.evidence.empty}</Text>
            ) : (
              <div className={styles.rowList}>
                {data.commands.map(command => (
                  <div key={command.id} className={styles.commandRow}>
                    <span className={styles.cellStack}>
                      <Text as="span" role="bodyStrong">{command.command}</Text>
                      <Text as="span" tone="muted">{command.reason ?? "—"}</Text>
                    </span>
                    <StatusPill tone={commandStatusTone(command.status)}>{commandStatusLabel(command.status, locale)}</StatusPill>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </ShellPageFrame>
  );
}
