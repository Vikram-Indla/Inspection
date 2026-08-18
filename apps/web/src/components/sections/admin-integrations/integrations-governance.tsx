import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import { Text } from "@/components/saqeel/type";
import type { AdminIntegrationsMessages } from "@/features/admin-integrations/strings";
import styles from "./integrations.module.css";

export default function IntegrationsGovernance({ strings }: { strings: AdminIntegrationsMessages }) {
  return (
    <div className={styles.split}>
      <Card as="section">
        <CardHeader level="h2" title={strings.governance.title} />
        <CardBody>
          <ul className={styles.governanceList}>
            {strings.governance.points.map(point => (
              <li key={point}><Text tone="secondary">{point}</Text></li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card as="section">
        <CardHeader level="h2" title={strings.governance.noteTitle} />
        <CardBody><Text tone="secondary">{strings.governance.note}</Text></CardBody>
      </Card>
    </div>
  );
}
