import FieldLocationMap from "@/components/field/FieldLocationMap";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import { dataOrDash, type MyTasksCopy } from "@/features/field-my-tasks/labels";
import type { MyTasksDetail } from "@/features/field-my-tasks/queries";
import styles from "./my-tasks.module.css";

export default function MyTasksLocation({ detail, copy }: {
  detail: MyTasksDetail;
  copy: MyTasksCopy;
}) {
  const located = detail.lat !== null && detail.lng !== null;

  return (
    <Card as="section" labelledBy="my-tasks-location">
      <CardHeader level="h2" titleId="my-tasks-location" title={copy.location.heading} />
      <CardBody>
        <div className={styles.pair}>
          <Text role="label" tone="secondary">{copy.location.address}</Text>
          <Text as="span" dir="auto">{dataOrDash(copy, detail.address)}</Text>
        </div>

        {located ? (
          <div>
            <div className={styles.mapFrame}>
              <FieldLocationMap lat={detail.lat ?? 0} lng={detail.lng ?? 0} label={detail.factoryName} unavailableHeadingLevel={3} />
            </div>
            <div className={styles.mapCaption}>
              <Text role="label" tone="muted">{copy.location.official}</Text>
            </div>
          </div>
        ) : (
          <Text tone="muted" live="status">{copy.location.unavailable}</Text>
        )}
      </CardBody>
    </Card>
  );
}
