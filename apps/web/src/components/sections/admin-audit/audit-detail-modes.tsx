import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { ledgerTone, type AdminAuditMessages } from "@/features/admin-audit/strings";
import type { completenessFor, ReplayEvent } from "@/lib/audit-replay";
import styles from "./audit.module.css";

type Completeness = ReturnType<typeof completenessFor>;

export default function AuditDetailModes({ mode, completeness, completenessAvailable, events, strings }: {
  mode: "ledger" | "custody" | "print";
  completeness: Completeness;
  completenessAvailable: boolean;
  events: readonly ReplayEvent[];
  strings: AdminAuditMessages;
}) {
  const l = strings.ledger;

  if (mode === "ledger") {
    return (
      <Card as="section">
        <CardHeader level="h2" title={`${strings.modes.ledger} · ${completenessAvailable ? `${completeness.found}/${completeness.expected}` : l.missing}`} />
        <CardBody>
          {completenessAvailable ? null : (
            <Card as="section" role="note"><CardBody><Text tone="warning">{l.selectCase}</Text></CardBody></Card>
          )}
          <div className={styles.rowStack}>
            {completeness.rows.map(row => (
              <div key={row.requirementId} className={styles.ledgerRow}>
                <Text as="span" role="mono" tone="muted" dir="ltr">{row.requirementId}</Text>
                <Text as="span" role="bodyStrong" dir="ltr">{row.eventType}</Text>
                <span className={styles.grow} />
                <StatusPill tone={ledgerTone(row.found, row.defaultStatus)}>{row.found ? l.found : row.defaultStatus === "needs_contract" ? l.needs : l.missing}</StatusPill>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (mode === "custody") {
    return (
      <Card as="section">
        <CardHeader level="h2" title={strings.modes.custody} />
        <CardBody>
          <div className={styles.rowStack}>
            {events.map(event => (
              <div key={event.id} className={styles.custodyRow}>
                <Text as="span" role="mono" tone="muted" dir="ltr">{event.id}</Text>
                <Text as="span" dir="ltr">{event.eventType}</Text>
                <span className={styles.grow} />
                <Text as="span" role="label" tone="muted">{`${strings.detail.integrity}: ${event.integrityStatus}`}</Text>
                <Text as="span" role="label" tone="muted">{`${strings.detail.chain}: ${event.chainStatus}`}</Text>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card as="section">
      <CardHeader level="h2" title={strings.modes.print} />
      <CardBody>
        <Text tone="secondary">{strings.policy}</Text>
        <div className={styles.rowStack}>
          {events.map(event => (
            <Text key={event.id} as="span" role="mono" tone="secondary" dir="ltr">
              {`${event.occurredAt} · ${event.eventType} · ${event.provenance} · ${event.integrityStatus}`}
            </Text>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
