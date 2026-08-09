import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import {
  deriveLifecycle, lifecycleTone, mappingStateOf, primaryMapping, severityTone, type CatalogueCode,
} from "@/features/enforcement/catalogue";
import { fill } from "@/i18n/messages";
import styles from "./penalty-mapping-card.module.css";

export type PenaltyMappingStrings = {
  readonly severity: string;
  readonly lensMapped: string;
  readonly lensDraft: string;
  readonly lensUnmapped: string;
  readonly reference: string;
  readonly legalBasis: string;
  readonly type: string;
  readonly amount: string;
  readonly noAmount: string;
  readonly grace: string;
  readonly due: string;
  readonly days: string;
  readonly effective: string;
  readonly mappingVersion: string;
  readonly state: string;
  readonly unmappedBody: string;
  readonly absent: string;
  readonly lifecycleActive: string;
  readonly lifecycleFuture: string;
  readonly lifecycleDeactivated: string;
};

export default function PenaltyMappingCard({ code, today, formatAmount, formatDay, labelFor, strings }: {
  code: CatalogueCode;
  today: string;
  formatAmount: (value: number) => string;
  formatDay: (iso: string) => string;
  labelFor: (value: string) => string;
  strings: PenaltyMappingStrings;
}) {
  const mapping = primaryMapping(code.penalty_mappings);
  const state = mappingStateOf(code.penalty_mappings);
  const lifecycle = deriveLifecycle(code.active_from, code.active_to, today);
  const lifecycleLabel = lifecycle === "active" ? strings.lifecycleActive
    : lifecycle === "future" ? strings.lifecycleFuture : strings.lifecycleDeactivated;
  const missing = <span className={styles.absent}>{strings.absent}</span>;
  const days = (value: number | null) => value === null ? missing : fill(strings.days, { days: value });

  return (
    <Card as="article">
      <CardHeader
        level="h3"
        eyebrow={<bdi className={styles.code}>{code.code}</bdi>}
        title={code.title}
        trailing={
          <span className={styles.pills}>
            <StatusPill tone={severityTone(code.level)}>{fill(strings.severity, { level: code.level })}</StatusPill>
            <StatusPill tone={lifecycleTone(lifecycle)}>{lifecycleLabel}</StatusPill>
            <StatusPill tone={state === "active" ? "success" : "warning"}>
              {state === "active" ? strings.lensMapped : state === "draft" ? strings.lensDraft : strings.lensUnmapped}
            </StatusPill>
          </span>
        }
      />
      <CardBody gap="tight">
        {!mapping ? (
          <p className={styles.muted}>{strings.unmappedBody}</p>
        ) : (
          <DefinitionList
            columns="two"
            items={[
              { label: strings.reference, value: <bdi className={styles.code}>{mapping.penalty_ref}</bdi> },
              { label: strings.legalBasis, value: mapping.legal_basis ? <bdi>{mapping.legal_basis}</bdi> : missing },
              { label: strings.type, value: mapping.penalty_type ? labelFor(mapping.penalty_type) : missing },
              {
                label: strings.amount,
                value: mapping.amount === null
                  ? <span className={styles.absent}>{strings.noAmount}</span>
                  : <bdi>{formatAmount(mapping.amount)}</bdi>,
              },
              { label: strings.grace, value: days(mapping.grace_period_days) },
              { label: strings.due, value: days(mapping.due_period_days) },
              {
                label: strings.effective,
                value: mapping.effective_from
                  ? <bdi>{formatDay(mapping.effective_from)}{mapping.effective_to ? ` → ${formatDay(mapping.effective_to)}` : ""}</bdi>
                  : missing,
              },
              { label: strings.mappingVersion, value: <bdi className={styles.code}>{mapping.mapping_version}</bdi> },
              { label: strings.state, value: labelFor(mapping.status) },
            ]}
          />
        )}
      </CardBody>
    </Card>
  );
}
