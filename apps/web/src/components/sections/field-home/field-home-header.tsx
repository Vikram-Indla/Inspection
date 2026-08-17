import FieldHeaderSync from "@/components/field/FieldHeaderSync";
import Button from "@/components/saqeel/button/button";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { FieldHomeCopy } from "@/features/field-home/labels";
import type { FieldHomeData } from "@/features/field-home/queries";
import { fill } from "@/i18n/messages";
import styles from "./field-home.module.css";

export default function FieldHomeHeader({ data, copy }: {
  data: FieldHomeData;
  copy: FieldHomeCopy;
}) {
  const greeting = fill(copy.greeting[data.partOfDay], {
    name: data.firstName ?? copy.greeting.inspector,
  });

  return (
    <header className={styles.header}>
      <div className={styles.headerIdentity}>
        <Heading level={1} visual="subheading">{greeting}</Heading>
        <Text role="label" tone="secondary" as="p">{data.dateLine}</Text>
      </div>

      <div className={styles.headerControls}>
        <span className={styles.datePill}>
          <Icon name="calendar" size="sm" />
          <Text role="label" tone="secondary" as="span">{data.dateShort}</Text>
        </span>

        <FieldHeaderSync
          userId={data.userId}
          strings={{
            online: copy.header.online,
            offline: copy.header.offline,
            syncNow: copy.header.syncNow,
            syncing: copy.header.syncing,
          }}
        />

        <Button href="/field/search" prefetch={false} variant="tertiary" size="sm" icon="search">
          {copy.header.search}
        </Button>

        <Button href="/field/notifications" prefetch={false} variant="tertiary" size="sm" icon="notify">
          {copy.header.notifications}
        </Button>

        {data.hasUnread ? <StatusPill tone="danger">{copy.header.unread}</StatusPill> : null}
      </div>
    </header>
  );
}
