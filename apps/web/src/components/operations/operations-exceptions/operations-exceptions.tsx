import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export type ExceptionRow = {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly detail: string;
  readonly atLabel: string | null;
  readonly href: string;
};

export type ExceptionStrings = {
  readonly title: string;
  readonly scope: string;
  readonly openBoard: string;
  readonly openRecord: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

const MAX_ROWS = 8;

export default function OperationsExceptions({ rows, boardHref, strings }: {
  rows: readonly ExceptionRow[];
  boardHref: string;
  strings: ExceptionStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-exceptions">
      <CardHeader
        level="h2"
        titleId="operations-exceptions"
        title={strings.title}
        description={strings.scope}
        trailing={
          <Button variant="secondary" size="sm" href={boardHref} label={strings.openBoard}>
            {strings.openBoard}
          </Button>
        }
      />
      <CardBody>
        {rows.length ? (
          <ListRows labelledBy="operations-exceptions">
            {rows.slice(0, MAX_ROWS).map(row => (
              <ListRow
                key={row.id}
                badge={<StatusPill tone="warning" ping={false}>{row.kind}</StatusPill>}
                title={row.title}
                description={row.atLabel ? `${row.detail} · ${row.atLabel}` : row.detail}
                trailing={
                  <Button
                    variant="secondary" size="sm" href={row.href}
                    label={`${strings.openRecord} — ${row.kind} — ${row.title}`}
                  >
                    {strings.openRecord}
                  </Button>
                }
              />
            ))}
          </ListRows>
        ) : (
          <EmptyState icon="risk" title={strings.emptyTitle} description={strings.emptyBody} size="sm" />
        )}
      </CardBody>
    </Card>
  );
}
