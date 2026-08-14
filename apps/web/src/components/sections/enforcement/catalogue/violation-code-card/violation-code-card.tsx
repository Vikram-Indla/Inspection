import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import {
  deriveLifecycle, lifecycleTone, mappingStateOf, severityTone,
  type CatalogueCode, type TriggerTrace,
} from "@/features/enforcement/catalogue";
import { fill } from "@/i18n/messages";
import styles from "./violation-code-card.module.css";

export type ViolationCodeStrings = {
  readonly severity: string;
  readonly legalTrace: string;
  readonly noAnchor: string;
  readonly configVersion: string;
  readonly category: string;
  readonly applicability: string;
  readonly correctiveAction: string;
  readonly grace: string;
  readonly graceDays: string;
  readonly mapped: string;
  readonly draftMapping: string;
  readonly unmapped: string;
  readonly triggers: string;
  readonly triggersEmpty: string;
  readonly triggersUnavailable: string;
  readonly versions: string;
  readonly derivation: string;
  readonly absent: string;
  readonly lifecycleActive: string;
  readonly lifecycleFuture: string;
  readonly lifecycleDeactivated: string;
};

export default function ViolationCodeCard({ code, triggers, triggersReadable, versions, today, labelFor, strings }: {
  code: CatalogueCode;
  triggers: readonly TriggerTrace[];
  triggersReadable: boolean;
  versions: readonly CatalogueCode[];
  today: string;
  labelFor: (value: string) => string;
  strings: ViolationCodeStrings;
}) {
  const lifecycle = deriveLifecycle(code.active_from, code.active_to, today);
  const lifecycleLabel = lifecycle === "active" ? strings.lifecycleActive
    : lifecycle === "future" ? strings.lifecycleFuture : strings.lifecycleDeactivated;
  const mapping = mappingStateOf(code.penalty_mappings);
  const clause = code.regulation_clauses;
  const missing = <span className={styles.absent}>{strings.absent}</span>;

  return (
    <Card as="article">
      <CardHeader
        level="h3"
        title={code.title}
        description={<bdi className={styles.code}>{code.code}</bdi>}
        trailing={
          <span className={styles.pills}>
            <StatusPill tone={severityTone(code.level)}>{fill(strings.severity, { level: code.level })}</StatusPill>
            <StatusPill tone={lifecycleTone(lifecycle)}>{lifecycleLabel}</StatusPill>
            <StatusPill tone={mapping === "active" ? "success" : mapping === "draft" ? "warning" : "neutral"}>
              {mapping === "active" ? strings.mapped : mapping === "draft" ? strings.draftMapping : strings.unmapped}
            </StatusPill>
          </span>
        }
      />
      <CardBody gap="tight">
        <DefinitionList
          columns="two"
          items={[
            {
              label: strings.legalTrace,
              value: clause
                ? <bdi className={styles.code}>{clause.regulations?.code ?? "—"} §{clause.clause_ref}</bdi>
                : <span className={styles.absent}>{strings.noAnchor}</span>,
            },
            { label: strings.configVersion, value: <bdi>{code.configuration_version}</bdi> },
            { label: strings.category, value: code.category ? labelFor(code.category) : missing },
            { label: strings.applicability, value: code.applicability ?? missing },
            { label: strings.correctiveAction, value: code.corrective_action ?? missing },
            {
              label: strings.grace,
              value: code.grace_period_days === null ? missing : fill(strings.graceDays, { days: code.grace_period_days }),
            },
          ]}
        />

        <details className={styles.disclosure}>
          <summary className={styles.summary}>{fill(strings.triggers, { count: triggers.length })}</summary>
          {!triggersReadable ? (
            <p className={styles.muted}>{strings.triggersUnavailable}</p>
          ) : triggers.length === 0 ? (
            <p className={styles.muted}>{strings.triggersEmpty}</p>
          ) : (
            <ul className={styles.list}>
              {triggers.map(trigger => (
                <li key={trigger.code}>
                  <bdi className={styles.code}>{trigger.code}</bdi> — {trigger.title}
                </li>
              ))}
            </ul>
          )}
        </details>

        <details className={styles.disclosure}>
          <summary className={styles.summary}>{fill(strings.versions, { count: versions.length })}</summary>
          <ol className={styles.list}>
            {versions.map(version => (
              <li key={version.id}>
                <bdi>{version.configuration_version}</bdi> · {labelFor(version.status)} · <bdi>{version.active_from ?? "—"}</bdi>
                {version.deactivation_reason ? ` · ${version.deactivation_reason}` : ""}
              </li>
            ))}
          </ol>
        </details>

        <p className={styles.muted}>
          {fill(strings.derivation, {
            from: code.active_from ?? "—",
            to: code.active_to ?? "—",
            today,
          })}
        </p>
      </CardBody>
    </Card>
  );
}
