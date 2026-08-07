import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./operations-exceptions.module.css";

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
        trailing={<StatusPill tone="neutral" size="sm">{strings.scope}</StatusPill>}
      />
      <CardBody gap="tight">
        {rows.length ? rows.slice(0, MAX_ROWS).map(row => (
          <div className={styles.row} key={row.id}>
            <StatusPill tone="warning" size="sm" ping>{strings.open}</StatusPill>
            <span className={styles.detail}>
              <span className={styles.label}>{row.label}</span>
              <span className={styles.description}>{row.description}</span>
            </span>
            <Button variant="secondary" size="sm" href={row.href} label={`${strings.openRecord} — ${row.label}`}>
              {strings.openRecord}
            </Button>
          </div>
        )) : (
          <EmptyState icon="risk" title={strings.emptyTitle} description={strings.emptyBody} size="sm" />
        )}
      </CardBody>
    </Card>
  );
}
