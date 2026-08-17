import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import { Heading, Text } from "@/components/saqeel/type";
import type { UnregisteredData } from "@/features/field-unregistered/queries";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import UnregisteredForm from "./unregistered-form";
import styles from "./unregistered.module.css";

export default function UnregisteredScreen({ data, locale }: {
  data: UnregisteredData;
  locale: Locale;
}) {
  const copy = getMessages(locale).fieldUnregistered;

  return (
    <>
      <header className={styles.header}>
        <Button href="/field/establishments" prefetch={false} variant="tertiary" size="sm" icon="previousPage">
          {copy.back}
        </Button>
        <div className={styles.headerIdentity}>
          <Heading level={1} visual="subheading">{copy.title}</Heading>
          <Text role="label" tone="secondary" as="p">{copy.subtitle}</Text>
        </div>
      </header>

      <div className={styles.page}>
        <Card as="section" role="note">
          <CardBody>
            <div className={styles.note}>
              <Icon name="info" size="sm" />
              <Text tone="secondary" as="p">{copy.note}</Text>
            </div>
          </CardBody>
        </Card>

        <Card as="section">
          <CardBody>
            <UnregisteredForm locale={locale} copy={copy} packages={data.packages} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
