import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { AdminAuditMessages } from "@/features/admin-audit/strings";
import type { compareReconstructions, ReconstructedAggregate } from "@/lib/audit-replay";
import { AuditCode } from "./audit-code";
import styles from "./audit.module.css";

type Comparison = ReturnType<typeof compareReconstructions>;

function DateField({ label, name, value, id }: { label: string; name: string; value: string | null; id: string }) {
  return (
    <div className={styles.field}>
      <Field label={label} htmlFor={id}>
        <input className={styles.dateInput} id={id} type="datetime-local" name={name} defaultValue={value?.slice(0, 16) ?? ""} />
      </Field>
    </div>
  );
}

export default function AuditTimeTravel({ mode, caseRef, at, vs, atState, comparison, strings }: {
  mode: "reconstruct" | "compare";
  caseRef: string;
  at: string | null;
  vs: string | null;
  atState: readonly ReconstructedAggregate[];
  comparison: Comparison;
  strings: AdminAuditMessages;
}) {
  const t = strings.timetravel;

  if (mode === "reconstruct") {
    return (
      <Card as="section">
        <CardHeader level="h2" title={strings.modes.reconstruct} />
        <CardBody>
          <form method="get" className={styles.modeForm}>
            <input type="hidden" name="view" value="reconstruct" />
            <input type="hidden" name="case" value={caseRef} />
            <DateField label={t.at} name="at" value={at} id="audit-at" />
            <Button type="submit" variant="primary">{strings.filter.apply}</Button>
          </form>
          <Text role="label" tone="muted">{`${atState.length} ${strings.terms.reconstructedStates}`}</Text>
          {atState.map(row => (
            <Card as="section" key={row.key}>
              <CardBody>
                <div className={styles.ledgerRow}>
                  <Text as="span" role="bodyStrong" dir="ltr">{row.key}</Text>
                  <Text as="span" role="label" tone="muted" dir="ltr">{`${row.eventIds.length} ${strings.terms.sourceEvents} · ${strings.terms.last} ${row.lastOccurredAt}`}</Text>
                  {row.conflicts.length > 0 ? <StatusPill tone="danger">{strings.tags.conflict}</StatusPill> : null}
                </div>
                <AuditCode value={row.state} />
              </CardBody>
            </Card>
          ))}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card as="section">
      <CardHeader level="h2" title={strings.modes.compare} />
      <CardBody>
        <form method="get" className={styles.modeForm}>
          <input type="hidden" name="view" value="compare" />
          <input type="hidden" name="case" value={caseRef} />
          <DateField label={t.at} name="at" value={at} id="audit-cmp-at" />
          <DateField label={t.vs} name="vs" value={vs} id="audit-cmp-vs" />
          <Button type="submit" variant="primary">{strings.filter.apply}</Button>
        </form>
        {comparison.map(row => (
          <Card as="section" key={row.key}>
            <CardHeader level="h3"
              title={<span dir="ltr">{row.key}</span>}
              trailing={<StatusPill tone={row.changed ? "warning" : "neutral"}>{row.changed ? strings.terms.changed : strings.terms.unchanged}</StatusPill>} />
            <CardBody>
              <div className={styles.diffGrid}>
                <div className={styles.rowStack}><Text role="label" tone="muted">{strings.detail.before}</Text><AuditCode value={row.before?.state} /></div>
                <div className={styles.rowStack}><Text role="label" tone="muted">{strings.detail.after}</Text><AuditCode value={row.after?.state} /></div>
              </div>
            </CardBody>
          </Card>
        ))}
      </CardBody>
    </Card>
  );
}
