import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import styles from "./completed.module.css";

export default function CompletedUnavailable({ locale }: { locale: Locale }) {
  const copy = getMessages(locale).fieldCompleted;

  return (
    <>
      <header className={styles.header}>
        <Button href="/field/completed" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
        <div className={styles.headerIdentity}>
          <Heading level={1} visual="subheading">{copy.receipt.notFound}</Heading>
        </div>
      </header>
      <div className={styles.page}>
        <Card as="section" role="alert">
          <CardBody>
            <Text tone="secondary">{copy.receipt.integrity}</Text>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
