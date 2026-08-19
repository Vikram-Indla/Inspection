import { Card } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import type { IconName } from "@/components/saqeel/icon/icon-registry";
import { Heading, Metric, Text } from "@/components/saqeel/type";
import type { FieldHomeCopy } from "@/features/field-home/labels";
import styles from "./field-home.module.css";

type ProgressStyle = { inlineSize: string };

function InsightItem({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <div className={styles.insightItem}>
      <Icon name={icon} size="md" />
      <div className={styles.insightBody}>
        <Metric>{value}</Metric>
        <Text role="label" tone="secondary">{label}</Text>
      </div>
    </div>
  );
}

export default function FieldInsightStrip({ today, remaining, pending, progressPct, copy }: {
  today: number;
  remaining: number;
  pending: number;
  progressPct: number;
  copy: FieldHomeCopy;
}) {
  const fillStyle: ProgressStyle = { inlineSize: `${progressPct}%` };

  return (
    <section aria-labelledby="field-insight-heading">
      <div className={styles.sectionHead}>
        <Heading level={2} visual="label" id="field-insight-heading">{copy.insight.heading}</Heading>
      </div>

      <Card as="div">
        <div className={styles.insightStrip}>
          <InsightItem icon="calendar" value={String(today)} label={copy.insight.today} />
          <InsightItem icon="elapsed" value={String(remaining)} label={copy.insight.remaining} />
          <InsightItem icon="risk" value={String(pending)} label={copy.insight.pending} />
          <div className={styles.insightItem}>
            <Icon name="selected" size="md" />
            <div className={styles.insightBody}>
              <div className={styles.progressRow}>
                <Metric>{`${progressPct}%`}</Metric>
                <span className={styles.progressTrack}>
                  <span className={styles.progressFill} style={fillStyle} />
                </span>
              </div>
              <Text role="label" tone="secondary">{copy.insight.progress}</Text>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
