import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import type { FieldNotificationsData } from "@/features/field-notifications/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import NotificationAttentionList from "./notification-attention-list";
import styles from "./notifications.module.css";

export default function NotificationsScreen({ data, locale, filter }: {
  data: FieldNotificationsData;
  locale: Locale;
  filter: "all" | "unread";
}) {
  const copy = getMessages(locale).fieldNotifications;

  const header = (
    <header className={styles.header}>
      <Button href="/field" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
        {copy.back}
      </Button>
      <div className={styles.headerIdentity}>
        <Heading level={1} visual="subheading">{copy.title}</Heading>
      </div>
    </header>
  );

  if (data.failed) {
    return (
      <>
        {header}
        <div className={styles.page}>
          <Card as="section" role="alert">
            <CardBody>
              <Text tone="secondary">{copy.unavailable}</Text>
            </CardBody>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <NotificationAttentionList
        userId={data.userId}
        initialRows={data.rows}
        initialVisitNames={data.visitNames}
        locale={locale === "ar" ? "ar" : "en"}
        filter={filter}
        copy={copy}
      />
    </>
  );
}
