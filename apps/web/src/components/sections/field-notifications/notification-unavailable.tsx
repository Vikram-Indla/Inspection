import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./notifications.module.css";

export default function NotificationUnavailable({ locale }: { locale: Locale }) {
  const copy = getMessages(locale).fieldNotifications;

  return (
    <>
      <header className={styles.header}>
        <Button href="/field/notifications" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
        <div className={styles.headerIdentity}>
          <Heading level={1} visual="subheading">{copy.detail.title}</Heading>
        </div>
      </header>
      <div className={styles.detailPage}>
        <Card as="section" role="alert">
          <CardBody>
            <Text tone="secondary">{copy.detail.unavailable}</Text>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
