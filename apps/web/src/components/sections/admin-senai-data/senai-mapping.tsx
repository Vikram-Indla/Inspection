import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { AdminSenaiDataMessages } from "@/features/admin-senai-data/strings";
import styles from "./senai-data.module.css";

export default function SenaiMapping({ strings, na }: { strings: AdminSenaiDataMessages; na: string }) {
  const s = strings.mapping;
  return (
    <div className={styles.section}>
      <Text tone="secondary">{s.help}</Text>
      <Card as="section">
        <CardHeader level="h3" title={s.heading} trailing={<Text tone="muted">{na}</Text>} />
        <CardBody><Text tone="secondary">{s.body}</Text></CardBody>
      </Card>
    </div>
  );
}
