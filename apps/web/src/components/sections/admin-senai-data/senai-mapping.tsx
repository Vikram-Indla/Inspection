import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { AdminSenaiDataMessages } from "@/features/admin-senai-data/strings";
import styles from "./senai-data.module.css";

export default function SenaiMapping({ strings }: { strings: AdminSenaiDataMessages }) {
  const s = strings.mapping;
  return (
    <div className={styles.section}>
      <Text tone="secondary">{s.help}</Text>
      <Card as="section">
        <CardHeader level="h3" title={s.heading} trailing={<StatusPill tone="warning">{strings.notConfigured}</StatusPill>} />
        <CardBody><Text tone="secondary">{s.body}</Text></CardBody>
      </Card>
    </div>
  );
}
