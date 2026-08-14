import Link from "next/link";
import { type ReactNode } from "react";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type/text";
import styles from "./notification-row.module.css";

export type NotificationRowProps = {
  tone: StatusTone;
  eventLabel: string;
  timeLabel: string;
  unread: boolean;
  unreadTag: string;
  subject: string | null;
  meta: string | null;
  detail: string | null;
  href: string | null;
  onOpen: () => void;
};

export default function NotificationRow({
  tone,
  eventLabel,
  timeLabel,
  unread,
  unreadTag,
  subject,
  meta,
  detail,
  href,
  onOpen,
}: NotificationRowProps) {
  const content: ReactNode = (
    <>
      <span className={styles.head}>
        <StatusPill tone={tone} ping={unread}>{eventLabel}</StatusPill>
        <Text role="label" tone="muted" as="span" numeric>{timeLabel}</Text>
        {unread ? <span className="sqx-visually-hidden">{unreadTag}</span> : null}
      </span>
      {subject ? (
        <Text
          role={unread ? "bodyStrong" : "body"}
          tone={unread ? "primary" : "secondary"}
          as="span"
          clamp={2}
          dir="auto"
        >
          {subject}
        </Text>
      ) : null}
      {meta ? <Text role="body" tone="secondary" as="span" clamp={1} dir="auto">{meta}</Text> : null}
      {detail ? <Text role="body" tone="muted" as="span" clamp={1} dir="auto">{detail}</Text> : null}
    </>
  );

  return (
    <li className={styles.row} data-unread={unread ? "" : undefined}>
      {href ? (
        <Link className={styles.hit} href={href} prefetch={false} onClick={onOpen}>
          {content}
        </Link>
      ) : (
        <span className={styles.static}>{content}</span>
      )}
    </li>
  );
}
