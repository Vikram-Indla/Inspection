import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Stack from "@/components/saqeel/stack/stack";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import styles from "./factory-workforce.module.css";
import { Text } from "@/components/saqeel/type";

export type WorkforceKpi = {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly sub: string | null;
};

export type WorkforceStrings = {
  readonly title: string;
  readonly capacityNoteLabel: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
};

export default function FactoryWorkforce({ kpis, capacityNote, empty, sourceOwned, strings }: {
  kpis: readonly WorkforceKpi[];
  capacityNote: string | null;
  empty: boolean;
  sourceOwned: string;
  strings: WorkforceStrings;
}) {
  return (
    <Card as="section" labelledBy="workforce">
      <CardHeader level="h2" titleId="workforce" title={strings.title} />
      <CardBody>
        <Stack gap="default">
          {empty ? (
            <EmptyState icon="factory" title={strings.emptyTitle} description={strings.emptyDescription} />
          ) : (
            <Stack gap="default">
              <CardGrid min="sm">
                {kpis.map(kpi => <StatCard key={kpi.key} label={kpi.label} value={kpi.value} sub={kpi.sub ?? undefined} />)}
              </CardGrid>
              {capacityNote ? <Text tone="secondary"><Text as="strong" role="bodyStrong">{strings.capacityNoteLabel}</Text> — {capacityNote}</Text> : null}
            </Stack>
          )}
          <Text tone="muted">{sourceOwned}</Text>
        </Stack>
      </CardBody>
    </Card>
  );
}
