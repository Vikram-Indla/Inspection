import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { getMessages } from "@/i18n/messages";
import { notificationCategory, notificationVisual } from "@/features/field-notifications/meta";
import type { NotificationDetail } from "@/features/field-notifications/queries";
import NotificationTile from "./notification-tile";
import styles from "./notifications.module.css";

function Pair({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className={styles.descRow}>
      <Text role="label" tone="muted" as="dt">{term}</Text>
      <dd className={styles.descValue}>{children}</dd>
    </div>
  );
}

export default function NotificationDetailScreen({ detail, locale }: {
  detail: NotificationDetail;
  locale: Locale;
}) {
  const messages = getMessages(locale);
  const copy = messages.fieldNotifications;
  const detailCopy = copy.detail;
  const enums: Readonly<Record<string, string>> = messages.visits.enum;
  const heading = enums[detail.eventKey] ?? detail.eventKey.replace(/_/g, " ");
  const category = notificationCategory(detail.eventKey);

  const header = (
    <header className={styles.header}>
      <Button href="/field/notifications" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
        {copy.back}
      </Button>
      <div className={styles.headerIdentity}>
        <Heading level={1} visual="subheading">{detailCopy.title}</Heading>
      </div>
    </header>
  );

  return (
    <>
      {header}
      <div className={styles.detailPage}>
        {detail.receiptError ? (
          <Text tone="warning" live="alert">{detailCopy.receiptError}</Text>
        ) : null}

        <div className={styles.hero}>
          <NotificationTile visual={notificationVisual(detail.eventKey)} size="lg" />
          <div className={styles.heroText}>
            <Heading level={2} visual="subheading">{heading}</Heading>
            <Text role="label" tone="muted">{formatDateTime(detail.createdAt, locale === "ar" ? "ar" : "en")}</Text>
          </div>
        </div>

        {detail.message ? (
          <Card as="section">
            <CardBody>
              <Text tone="secondary" dir="auto">{detail.message}</Text>
            </CardBody>
          </Card>
        ) : null}

        <dl className={styles.desc}>
          {category ? <Pair term={detailCopy.categoryLabel}><Text as="span">{copy.category[category]}</Text></Pair> : null}
          {detail.sender ? <Pair term={detailCopy.sender}><Text as="span" dir="auto">{detail.sender}</Text></Pair> : null}
          <Pair term={detailCopy.eventKey}><Mono as="span">{detail.eventKey}</Mono></Pair>
          <Pair term={detailCopy.notifId}><Mono as="span">{detail.id}</Mono></Pair>
          {detail.entries.map(entry => (
            <Pair key={entry.key} term={entry.key}><Mono as="span">{entry.value}</Mono></Pair>
          ))}
        </dl>

        {detail.entries.length === 0 ? (
          <Text role="label" tone="muted" live="status">{detailCopy.payloadEmpty}</Text>
        ) : null}

        {detail.deepLink ? (
          <Button href={detail.deepLink} prefetch={false} variant="primary" block>{detailCopy.openVisit}</Button>
        ) : null}
      </div>
    </>
  );
}
