import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Heading, Text } from "@/components/saqeel/type";
import type { FieldHomeCopy } from "@/features/field-home/labels";
import styles from "./field-home.module.css";

export default function FieldHomeUnavailable({ brief, copy }: {
  brief: string;
  copy: FieldHomeCopy;
}) {
  return (
    <div className={styles.unavailable}>
      <Card as="section" role="alert">
        <CardHeader level="h2" title={copy.unavailable.alert} />
        <CardBody gap="tight">
          <Text tone="secondary">{copy.unavailable.scope}</Text>
        </CardBody>
      </Card>

      {brief ? (
        <Card as="section">
          <CardHeader level="h2" title={copy.unavailable.briefHeading} />
          <CardBody>
            <Text tone="secondary" dir="auto">{brief}</Text>
          </CardBody>
        </Card>
      ) : null}

      <nav aria-labelledby="field-still-available">
        <div className={styles.sectionHead}>
          <Heading level={2} visual="label" id="field-still-available">
            {copy.unavailable.stillAvailable}
          </Heading>
        </div>
        <div className={styles.actions}>
          <Button href="/field" prefetch={false} variant="secondary">{copy.unavailable.retry}</Button>
          <Button href="/field/my-tasks" prefetch={false} variant="secondary">{copy.unavailable.myTasks}</Button>
          <Button href="/field/establishments" prefetch={false} variant="secondary">{copy.unavailable.establishments}</Button>
          <Button href="/field/notifications" prefetch={false} variant="secondary">{copy.unavailable.notifications}</Button>
        </div>
      </nav>
    </div>
  );
}
