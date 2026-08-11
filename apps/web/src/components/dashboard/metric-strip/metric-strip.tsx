"use client";

import { Card, CardBody, CardGrid, CardValue, CardValueSlot } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { MetricStripStrings } from "@/features/dashboard/strip";
import type { DisplayTone, MetricDisplay, MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import styles from "./metric-strip.module.css";
import { Text } from "@/components/saqeel/type";
import { useExplain } from "../explain-panel/explain-panel";

const TONE: Readonly<Record<DisplayTone, StatusTone>> = {
  critical: "danger",
  warning: "warning",
  success: "success",
  info: "info",
  neutral: "neutral",
};

export default function MetricStrip({ metrics, methodology, strings, min = "sm" }: {
  metrics: readonly MetricDisplay[];
  methodology: Readonly<Record<string, MethodologyEntry>>;
  strings: MetricStripStrings;
  min?: "sm" | "md";
}) {
  const { openEntry, activeId } = useExplain();

  return (
    <CardGrid min={min}>
      {metrics.map(metric => {
        const entry = methodology[metric.metricId];
        const label = metric.kind === "status" ? strings.why : strings.methodology;
        return (
          <Card as="article" key={metric.metricId}>
            <CardBody gap="tight">
              <div className={styles.label}>
                <Text role="label" tone="muted">{metric.title}</Text>
              </div>
              <CardValueSlot>
                {metric.kind === "status"
                  ? <StatusPill tone={TONE[metric.tone]} ping>{metric.text}</StatusPill>
                  : <CardValue size="md">{metric.text}</CardValue>}
              </CardValueSlot>
              <span className={styles.foot}>
                {metric.sub ? <Text as="span" tone="muted">{metric.sub}</Text> : null}
                {entry ? (
                  <span className={styles.disclosure}>
                    <Button
                      variant="tertiary" size="sm" hasPopup="dialog"
                      expanded={activeId === metric.metricId}
                      label={label}
                      onClick={() => openEntry(entry)}
                    >
                      {label}
                    </Button>
                  </span>
                ) : null}
              </span>
            </CardBody>
          </Card>
        );
      })}
    </CardGrid>
  );
}
