import Link from "next/link";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { formatDateTime } from "@/lib/dates";
import { assignmentNoticeKind, type FieldNotificationRow } from "@/lib/field-notifications";
import { isNotificationUnread } from "@/lib/notification-read";
import { notificationVisual, RETURN_VISUAL } from "@/features/field-notifications/meta";
import type { Messages } from "@/i18n/messages";
import NotificationTile from "./notification-tile";
import styles from "./notifications.module.css";

export default function NotificationRow({ row, visitNames, locale, copy, onAcknowledge }: {
  row: FieldNotificationRow;
  visitNames: Record<string, string>;
  locale: "en" | "ar";
  copy: Messages["fieldNotifications"];
  onAcknowledge: (row: FieldNotificationRow) => void;
}) {
  const kind = assignmentNoticeKind(row);
  const visual = kind === "released" ? RETURN_VISUAL : notificationVisual(row.event_key);
  const visitId = typeof row.payload?.visit_id === "string" ? row.payload.visit_id : null;
  const detail = visitId && visitNames[visitId]
    ? visitNames[visitId]
    : [row.payload?.reason, row.payload?.decision, row.payload?.factory]
        .find(value => typeof value === "string" && value) as string | undefined;
  const unread = isNotificationUnread(row);

  return (
    <li className={styles.row} data-unread={unread ? "" : undefined}>
      <NotificationTile visual={visual} />
      <div className={styles.rowBody}>
        <div className={styles.rowTitle}>
          <Link className={styles.titleLink} href={`/field/notifications/${encodeURIComponent(row.id)}`} prefetch={false}>
            <Text role="bodyStrong" as="span" dir="auto">{copy.kinds[kind]}</Text>
          </Link>
          {unread ? <StatusPill tone="warning" ping={false}>{copy.newBadge}</StatusPill> : null}
          {unread ? (
            <span className={styles.markRead}>
              <Button variant="tertiary" size="sm" onClick={() => onAcknowledge(row)}>{copy.markRead}</Button>
            </span>
          ) : null}
        </div>
        {detail ? <Text role="label" tone="secondary" dir="auto" clamp={2}>{detail}</Text> : null}
        <Text role="label" tone="muted">{formatDateTime(row.created_at, locale)}</Text>
      </div>
    </li>
  );
}
