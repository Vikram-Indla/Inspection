import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { AdminAccessMessages } from "@/features/admin-access/strings";
import styles from "./access-governance.module.css";

export default function AccessGovernance({ strings, readOnly }: {
  strings: AdminAccessMessages;
  readOnly: boolean;
}) {
  const lines = readOnly
    ? [strings.governance.rls, strings.governance.readOnly]
    : [strings.governance.rls, strings.governance.audit, strings.governance.effect];

  return (
    <Card>
      <CardHeader level="h2" title={strings.governance.heading} />
      <CardBody>
        <ul className={styles.list}>
          {lines.map(line => (
            <li key={line}>
              <Text as="span" tone="secondary">{line}</Text>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
