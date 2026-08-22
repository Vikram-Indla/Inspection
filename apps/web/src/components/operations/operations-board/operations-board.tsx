import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import { Text } from "@/components/saqeel/type";
import type { ExceptionGroupView } from "@/features/operations/exceptions/view";

export type OperationsBoardStrings = {
  readonly heading: string;
  readonly degraded: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

export default function OperationsBoard({ groups, degraded, strings: s }: {
  groups: readonly ExceptionGroupView[];
  degraded: boolean;
  strings: OperationsBoardStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-board">
      <CardHeader
        level="h2"
        titleId="operations-board"
        title={s.heading}
      />
      <CardBody>
        {degraded && groups.length > 0 ? (
          <Text as="p" role="label" tone="warning" live="status">{s.degraded}</Text>
        ) : null}
        {groups.length ? (
          <CardGrid min="sm">
            {groups.map(group => (
              <StatCard
                key={group.category}
                label={group.label}
                value={group.count}
                sub={group.mostRecent}
                action={group.href && group.action
                  ? (
                    <Button variant="tertiary" size="sm" href={group.href} label={group.action}>
                      {group.action}
                    </Button>
                  )
                  : undefined}
              />
            ))}
          </CardGrid>
        ) : (
          <EmptyState icon="review" title={s.emptyTitle} description={s.emptyBody} />
        )}
      </CardBody>
    </Card>
  );
}
