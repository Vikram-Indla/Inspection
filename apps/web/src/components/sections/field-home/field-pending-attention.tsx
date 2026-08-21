import Button from "@/components/saqeel/button/button";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Heading, Metric, Text } from "@/components/saqeel/type";
import type { FieldHomeCopy } from "@/features/field-home/labels";
import styles from "./field-home.module.css";

type AttentionHead = { pill: string; pillTone: StatusTone } | { na: string };

function AttentionCard({ icon, head, value, label, action }: {
  icon: IconName;
  head: AttentionHead;
  value: string;
  label: string;
  action: { href: string; label: string } | { note: string };
}) {
  return (
    <Card as="article">
      <CardBody gap="tight">
        <div className={styles.attentionHead}>
          <Icon name={icon} size="md" />
          {"na" in head
            ? <Text tone="muted">{head.na}</Text>
            : <StatusPill tone={head.pillTone} ping={false}>{head.pill}</StatusPill>}
        </div>
        <Metric>{value}</Metric>
        <Text role="label" tone="secondary">{label}</Text>
        {"href" in action ? (
          <Button href={action.href} prefetch={false} variant="secondary" block>{action.label}</Button>
        ) : (
          <Text role="label" tone="muted">{action.note}</Text>
        )}
      </CardBody>
    </Card>
  );
}

export default function FieldPendingAttention({ returned, drafts, copy, na }: {
  returned: number;
  drafts: number;
  copy: FieldHomeCopy;
  na: string;
}) {
  return (
    <section aria-labelledby="field-pending-heading">
      <div className={styles.sectionHead}>
        <Heading level={2} visual="label" id="field-pending-heading">{copy.pending.heading}</Heading>
      </div>

      <div className={styles.attentionGrid}>
        <AttentionCard
          icon="refresh"
          head={{ pill: copy.pending.priorityHigh, pillTone: "danger" }}
          value={String(returned)}
          label={copy.pending.returned}
          action={{ href: "/field/my-tasks", label: copy.pending.reviewNow }}
        />
        <AttentionCard
          icon="forms"
          head={{ pill: copy.pending.priorityMedium, pillTone: "warning" }}
          value={String(drafts)}
          label={copy.pending.drafts}
          action={{ href: "/field/drafts", label: copy.pending.resume }}
        />
        <AttentionCard
          icon="refresh"
          head={{ na }}
          value={copy.noValue}
          label={copy.pending.sync}
          action={{ note: copy.pending.syncManaged }}
        />
      </div>
    </section>
  );
}
