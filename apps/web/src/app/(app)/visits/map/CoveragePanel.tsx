import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import TrendBars from "@/components/saqeel/trend-bars/trend-bars";
import { Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import type { MappedVisit } from "./VisitMap";
import { regionalCoverage } from "./coverage-filters";
import styles from "./coverage-panel.module.css";

export type CoveragePanelStrings = {
  title: string;
  unassignedCount: string; unassignedEmpty: string;
  regionalTitle: string; regionalHelp: string; visitsCount: string;
  riskUnavailable: string;
};

export default function CoveragePanel({ visits, strings: s }: {
  visits: readonly MappedVisit[];
  strings: CoveragePanelStrings;
}) {
  const unassigned = visits.filter(visit => !visit.inspectorName);
  const regionalCounts = regionalCoverage([...visits]);
  const busiest = Math.max(1, ...regionalCounts.map(([, count]) => count));

  return (
    <section className={styles.root} aria-label={s.title}>
      <Card as="section">
        <CardHeader title={s.regionalTitle} description={s.regionalHelp} />
        <CardBody gap="tight">
          {regionalCounts.length === 0
            ? <EmptyState icon="map" title={s.unassignedEmpty} size="sm" />
            : (
              <TrendBars
                tone="info"
                label={s.regionalTitle}
                points={regionalCounts.map(([name, count]) => ({
                  key: name,
                  percent: Math.round((count / busiest) * 100),
                  label: `${name}: ${fill(s.visitsCount, { n: count })}`,
                  caption: name,
                  value: String(count),
                }))}
              />
            )}
        </CardBody>
      </Card>

      <Card as="section">
        <CardHeader title={fill(s.unassignedCount, { n: unassigned.length })} />
        <CardBody gap="tight">
          {unassigned.length === 0
            ? <EmptyState icon="factory" title={s.unassignedEmpty} size="sm" />
            : (
              <ListRows label={fill(s.unassignedCount, { n: unassigned.length })}>
                {unassigned.map(visit => (
                  <ListRow
                    key={visit.id}
                    href={`/factories/${visit.factoryId}`}
                    title={<Text as="span" dir="auto">{visit.factoryName}</Text>}
                    meta={<Text as="span" tone="muted" dir="auto">{visit.region}</Text>}
                    trailing={<StatusPill tone="neutral" ping={false}>{visit.riskBand ?? s.riskUnavailable}</StatusPill>}
                  />
                ))}
              </ListRows>
            )}
        </CardBody>
      </Card>
    </section>
  );
}
