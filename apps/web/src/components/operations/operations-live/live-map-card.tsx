import { type ReactNode } from "react";
import { Card, CardBody, CardHeader, CardMedia } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import styles from "./operations-live.module.css";

export type LiveDisclosure = {
  readonly id: string;
  readonly text: string;
  readonly live?: "status" | "alert";
};

export type LiveMapCardStrings = {
  readonly title: string;
  readonly countLabel: string;
  readonly ariaLabel: string;
  readonly markerLegend: string;
  readonly snapshotGenerated: string;
  readonly lastObserved: string;
  readonly noRecordedPositions: string;
  readonly freshnessPolicy: string;
  readonly recordedState: string;
};

export default function LiveMapCard({
  count,
  snapshotAt,
  snapshotLabel,
  positionObservedAt,
  positionObservedLabel,
  statePills,
  disclosures,
  strings: s,
  children,
}: {
  count: number;
  snapshotAt: string;
  snapshotLabel: string;
  positionObservedAt: string | null;
  positionObservedLabel: string | null;
  statePills: readonly { id: string; label: string }[];
  disclosures: readonly LiveDisclosure[];
  strings: LiveMapCardStrings;
  children: ReactNode;
}) {
  return (
    <Card as="section" labelledBy="live-map-card">
      <CardHeader
        level="h2"
        titleId="live-map-card"
        title={s.title}
        description={s.freshnessPolicy}
        trailing={<StatusPill tone="neutral" ping={false}>{`${count} ${s.countLabel}`}</StatusPill>}
      />
      <CardMedia height="lg" label={s.ariaLabel}>{children}</CardMedia>
      <CardBody gap="tight">
        <Text as="p" role="label" tone="secondary" numeric>
          {s.snapshotGenerated}:{" "}
          <time data-testid="live-snapshot-at" dateTime={snapshotAt}>{snapshotLabel}</time>
          {" · "}
          {positionObservedAt && positionObservedLabel
            ? <>{s.lastObserved}: <time dateTime={positionObservedAt}>{positionObservedLabel}</time></>
            : s.noRecordedPositions}
        </Text>
        <span className={styles.legend}>
          <StatusPill tone="success" ping={false}>{s.recordedState}</StatusPill>
          {statePills.map(pill => (
            <StatusPill key={pill.id} tone={pill.id === "rejected" ? "danger" : "warning"} ping={false}>
              {pill.label}
            </StatusPill>
          ))}
          <Text as="span" role="label" tone="muted">{s.markerLegend}</Text>
        </span>
        {disclosures.map(disclosure => (
          <Text key={disclosure.id} as="p" role="label" tone="secondary" live={disclosure.live}>
            {disclosure.text}
          </Text>
        ))}
      </CardBody>
    </Card>
  );
}
