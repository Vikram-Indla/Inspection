import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import OperationsAlerts, { DELIVERY_TONE, type AlertRow } from "@/components/operations/operations-alerts/operations-alerts";
import OperationsCancellations, { type CancellationRow } from "@/components/operations/operations-cancellations/operations-cancellations";
import type { OperationsData } from "@/features/operations/queries";
import { ActionFormControls, MarkNotificationHandled } from "../Controls";
import { makeLabelers } from "./labels";

export default async function AlertsSection({ data }: { data: OperationsData }) {
  const { t, locale } = await useT();
  const lab = makeLabelers(locale, t);
  const localeTag = locale === "ar" ? "ar" : "en";
  const mayManageOperations = data.routeRoleKeys.includes("supervisor");
  const actionControlStrings = {
    acknowledge: t("ops.actions.acknowledge", "Acknowledge"),
    close: t("ops.actions.close", "Close"),
    updated: t("ops.actions.updated", "updated"),
  };
  const markHandledStrings = {
    markHandled: t("ops.notifs.markHandled", "Mark handled"),
    handled: t("ops.notifs.handled", "handled"),
  };
  return (
    <>
      <OperationsAlerts
        actions={data.actions.map<AlertRow>(action => ({
          id: action.id,
          title: action.inspections?.visits?.factories?.name ?? action.form_type,
          description: action.required_correction ?? lab.enumLabel(action.status),
          meta: action.due_at
            ? formatDateTime(action.due_at, localeTag)
            : lab.local("No due date set", "لا يوجد تاريخ استحقاق محدد"),
          action: mayManageOperations
            ? <ActionFormControls actionFormId={action.id} status={action.status} strings={actionControlStrings} />
            : <StatusPill tone="neutral" ping={false}>{t("ops.readOnly", "Read only")}</StatusPill>,
        }))}
        notifications={data.notifs.map<AlertRow>(notification => ({
          id: notification.id,
          title: lab.enumLabel(notification.event_key),
          description: `${t(`enum.channel.${notification.channel}`, notification.channel === "inapp" ? "In-app" : humaniseEnum(notification.channel))} · ${formatDateTime(notification.created_at, localeTag)}`,
          status: {
            label: lab.enumLabel(notification.delivery_state),
            tone: DELIVERY_TONE[notification.delivery_state] ?? "neutral",
          },
          action: mayManageOperations && notification.delivery_state !== "handled"
            ? <MarkNotificationHandled notificationId={notification.id} strings={markHandledStrings} />
            : null,
        }))}
        strings={{
          title: t("ops.alerts.heading", "Operational alerts and corrective actions"),
          description: t("ops.alerts.body", "Action forms and notification status you can see here. The database still protects any changes."),
          actionsHeading: t("ops.actions.heading", "Corrective actions"),
          actionsEmpty: t("ops.actions.empty", "No open corrective actions."),
          notificationsHeading: t("ops.notifs.heading", "Notification delivery"),
          notificationsEmpty: t("ops.notifs.empty", "No notification events."),
          emptyTitle: t("ops.alerts.empty", "No operational alerts in this scope"),
        }}
      />
      <OperationsCancellations
        rows={data.cancellationHistoryRows.map<CancellationRow>(row => ({
          id: row.id,
          visitHref: `/visits/${row.visit_id}`,
          visitLabel: row.visit_id.slice(0, 8),
          factoryName: row.factory_name ?? "—",
          inspectorName: row.inspector_name ?? "—",
          region: row.region ?? "—",
          reason: `${row.reason_label}${row.decision_reason ? ` · ${row.decision_reason}` : ""}`,
          status: lab.enumLabel(row.status),
          statusKey: row.status,
          requestedAt: formatDateTime(row.requested_at, localeTag),
          requestedAtIso: row.requested_at,
          decidedAt: row.decided_at ? formatDateTime(row.decided_at, localeTag) : null,
          decidedAtIso: row.decided_at,
        }))}
        strings={{
          title: t("ops.cancellations.heading", "Cancellation monitoring"),
          description: t("ops.cancellations.body", "Recent cancellation requests, reasons and final decisions you can see. These decisions can't change."),
          visit: t("ops.live.th.visit", "Visit"),
          factory: t("ops.live.th.factory", "Factory"),
          inspector: t("ops.live.th.inspector", "Inspector"),
          region: t("ops.filter.region", "Region"),
          reason: t("ops.cancellations.reason", "Reason"),
          status: t("ops.cancellations.status", "Status"),
          requested: t("ops.cancellations.requested", "Requested"),
          decided: t("ops.cancellations.decided", "Decided"),
          emptyTitle: t("ops.cancellations.empty", "No cancellation history in this scope"),
          missing: "—",
        }}
      />
    </>
  );
}
