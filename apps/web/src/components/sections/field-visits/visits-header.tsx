import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import { Heading, Text } from "@/components/saqeel/type";
import type { VisitsCopy } from "@/features/field-visits/labels";
import styles from "./visits.module.css";

export default function VisitsHeader({ title, subtitle, userId, copy }: {
  title: string;
  subtitle: string;
  userId: string;
  copy: VisitsCopy;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerIdentity}>
        <Heading level={1} visual="subheading">{title}</Heading>
        <Text role="label" tone="secondary" as="p">{subtitle}</Text>
      </div>
      <div className={styles.headerControls}>
        <FieldHeaderSync
          userId={userId}
          strings={{
            online: copy.sync.online,
            offline: copy.sync.offline,
            syncNow: copy.sync.syncNow,
            syncing: copy.sync.syncing,
          }}
        />
      </div>
    </header>
  );
}
