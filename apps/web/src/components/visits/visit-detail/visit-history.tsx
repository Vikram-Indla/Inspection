import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Timeline from "@/components/saqeel/timeline/timeline";
import { Heading, Text } from "@/components/saqeel/type";
import type { TimedEntry } from "@/features/visits/detail/view";
import styles from "./visit-detail.module.css";

export type HistorySection = {
  readonly id: "lifecycle" | "location" | "journey" | "audit";
  readonly heading: string;
  readonly empty: string;
  readonly entries: readonly TimedEntry[];
  readonly lead?: ReactNode;
};

function Section({ section }: { section: HistorySection }) {
  return (
    <section id={section.id} className={styles.historySection} aria-labelledby={`history-${section.id}`}>
      <Heading level={3} visual="bodyStrong" id={`history-${section.id}`}>{section.heading}</Heading>
      {section.lead}
      {section.entries.length
        ? (
          <Timeline
            labelledBy={`history-${section.id}`}
            events={section.entries.map(entry => ({
              id: entry.id,
              dateTime: entry.dateTime,
              time: entry.time,
              title: entry.title,
              meta: entry.meta ?? undefined,
              detail: entry.detail ?? undefined,
            }))}
          />
        )
        : <Text as="p" role="label" tone="muted">{section.empty}</Text>}
    </section>
  );
}

export default function VisitHistory({ title, description, sections }: {
  title: string;
  description: string;
  sections: readonly HistorySection[];
}) {
  return (
    <Card as="section" labelledBy="visit-history">
      <CardHeader level="h2" titleId="visit-history" title={title} description={description} />
      <CardBody>
        {sections.map(section => <Section key={section.id} section={section} />)}
      </CardBody>
    </Card>
  );
}
