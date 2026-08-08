import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export type ExceptionRow = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
};

export type ExceptionStrings = {
  readonly title: string;
  readonly scope: string;
  readonly open: string;
  readonly openRecord: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

const MAX_ROWS = 8;

export default function OperationsExceptions({ rows, strings }: {
  rows: readonly ExceptionRow[];
  strings: ExceptionStrings;
}) {
  return (
    <Card as="section" labelledBy="operations-exceptions">
      <CardHeader
        level="h2"
        titleId="operations-exceptions"
        title={strings.title}
        trailing={<StatusPill tone="neutral" size="sm" ping={false}>{strings.scope}</StatusPill>}
      />
      <CardBody>
        {rows.length ? (
          <ListRows labelledBy="operations-exceptions">
            {rows.slice(0, MAX_ROWS).map(row => (
              <ListRow
                key={row.id}
                leading={<StatusPill tone="warning" size="sm">{strings.open}</StatusPill>}
                title={row.label}
                description={row.description}
                trailing={
                  <Button
                    variant="secondary" size="sm" href={row.href}
                    label={`${strings.openRecord} — ${row.label}`}
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
