"use client";

import { useFieldScope } from "@/components/field/FieldScopeProvider";
import { Card, CardBody } from "@/components/saqeel/card/card";
import SegmentedControl from "@/components/saqeel/segmented-control/segmented-control";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Metric, Text } from "@/components/saqeel/type";
import type { FieldHomeCopy } from "@/features/field-home/labels";
import type { FieldScopeStat } from "@/features/field-home/queries";
import { fill } from "@/i18n/messages";
import styles from "./field-home.module.css";

function MetricCell({ value, label, caption, tone }: {
  value: string;
  label: string;
  caption: string;
  tone?: "warning" | "muted";
}) {
  return (
    <div className={styles.metric}>
      <Metric tone={tone ?? "primary"}>{value}</Metric>
      <Text role="label">{label}</Text>
      <Text role="label" tone="muted">{caption}</Text>
    </div>
  );
}

export default function FieldMissionMetrics({ daily, weekly, returned, drafts, copy }: {
  daily: FieldScopeStat;
  weekly: FieldScopeStat;
  returned: number;
  drafts: number;
  copy: FieldHomeCopy;
}) {
  const { scope, setScope } = useFieldScope();
  const isWeekly = scope === "weekly";
  const stat = isWeekly ? weekly : daily;
  const mission = fill(isWeekly ? copy.mission.weekly : copy.mission.daily, { n: stat.remaining });

  return (
    <Card as="section" labelledBy="field-mission-heading">
      <CardBody>
        <div className={styles.missionRow}>
          <Heading level={2} visual="label" id="field-mission-heading">{copy.mission.heading}</Heading>
          <span className={styles.grow} />
          <StatusPill tone="warning" ping={false}>{`${returned} ${copy.mission.returned}`}</StatusPill>
          <StatusPill tone="pending" ping={false}>{`${drafts} ${copy.mission.drafts}`}</StatusPill>
          <SegmentedControl
            label={copy.mission.scopeLabel}
            value={scope}
            onChange={setScope}
            size="sm"
            items={[
              { value: "daily", label: copy.mission.scopeDaily },
              { value: "weekly", label: copy.mission.scopeWeekly },
            ]}
          />
        </div>

        <Text tone="secondary">{mission}</Text>

        <div className={styles.metricGrid}>
          <MetricCell
            value={String(stat.inspections)}
            label={copy.metric.inspections}
            caption={isWeekly ? copy.metric.capAssignedWeekly : copy.metric.capAssignedDaily}
          />
          <MetricCell
            value={String(stat.followUp)}
            label={copy.metric.followUp}
            caption={copy.metric.capFollowUp}
          />
          <MetricCell
            value={String(stat.highRisk)}
            label={copy.metric.highRisk}
            caption={copy.metric.capHighRisk}
            tone="warning"
          />
          {isWeekly ? (
            <MetricCell
              value={`${stat.completionPct}%`}
              label={copy.metric.completion}
              caption={copy.metric.capCompletion}
            />
          ) : (
            <MetricCell
              value={copy.noValue}
              label={copy.metric.finishTime}
              caption={copy.metric.notConfigured}
              tone="muted"
            />
          )}
        </div>
      </CardBody>
    </Card>
  );
}
