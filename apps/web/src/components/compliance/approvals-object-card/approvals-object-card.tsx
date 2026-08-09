import ActionForm from "@/app/(app)/admin/compliance-requests/ActionForm";
import { decideComplianceRequestComponent } from "@/app/(app)/admin/compliance-requests/actions";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { changedFields, changeKind, statusTone, type FieldComparison } from "@/features/compliance/presentation";
import type { ComponentRow, PublicationRow } from "@/features/compliance/types";
import type { Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./approvals-object-card.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];

function componentStatusLabel(status: string, messages: ApprovalsMessages, locale: Locale): string {
  const known = messages.status[status as keyof ApprovalsMessages["status"]];
  return known ?? humaniseEnum(status, locale);
}

function FieldCompare({ component, messages }: { component: ComponentRow; messages: ApprovalsMessages }) {
  const objects = messages.objects;
  return (
    <DataTable<FieldComparison>
      rows={changedFields(component)}
      getRowId={row => row.field}
      bleed={false}
      density="compact"
      empty={{ title: objects.empty }}
      columns={[
        {
          key: "field",
          header: objects.fieldColumn,
          isRowHeader: true,
          cell: row => (
            <span className={styles.fieldName}>
              {row.field}
              {row.changed ? <StatusPill tone="warning" size="sm" ping={false}>{objects.changed}</StatusPill> : null}
            </span>
          ),
        },
        { key: "current", header: objects.currentColumn, cell: row => <span dir="auto">{row.current}</span> },
        {
          key: "proposed",
          header: objects.proposedColumn,
          cell: row => <span className={styles.proposed} data-changed={row.changed ? "" : undefined} dir="auto">{row.proposed}</span>,
        },
      ]}
    />
  );
}

export default function ApprovalsObjectCard({ component, parents, publication, canReview, requestId, messages, locale }: {
  component: ComponentRow;
  parents: readonly ComponentRow[];
  publication: PublicationRow | null;
  canReview: boolean;
  requestId: string;
  messages: ApprovalsMessages;
  locale: Locale;
}) {
  const objects = messages.objects;
  const kindLabel = humaniseEnum(component.entity_kind, locale);
  return (
    <Card as="article">
      <CardHeader
        title={<bdi dir="auto">{kindLabel}</bdi>}
        eyebrow={kindLabel}
        trailing={
          <span className={styles.badges}>
            <StatusPill tone="info" size="sm" ping={false}>
              {changeKind(component) === "created" ? objects.created : objects.modified}
            </StatusPill>
            <StatusPill tone={statusTone(component.component_status)} size="sm">
              {componentStatusLabel(component.component_status, messages, locale)}
            </StatusPill>
          </span>
        }
      />
      <CardBody>
        <FieldCompare component={component} messages={messages} />
        <section className={styles.block} aria-label={objects.dependencies}>
          <h4 className={styles.blockHeading}>{objects.dependencies}</h4>
          {parents.length ? (
            <ul className={styles.depList}>
              {parents.map(parent => <li key={parent.id}>{humaniseEnum(parent.entity_kind, locale)}</li>)}
            </ul>
          ) : (
            <p className={styles.blockNote}>{objects.noDependencies}</p>
          )}
        </section>
        <section className={styles.block} aria-label={objects.impact}>
          <h4 className={styles.blockHeading}>{objects.impact}</h4>
          <p className={styles.blockNote}>{objects.impactUnavailable}</p>
        </section>
        {publication ? (
          <section className={styles.block} aria-label={objects.publishedVersion}>
            <h4 className={styles.blockHeading}>{objects.publishedVersion}</h4>
            <p className={styles.receipt}>
              {publication.version_id} · {formatDateTime(publication.published_at, locale)}
            </p>
          </section>
        ) : null}
        {canReview && component.component_status === "pending_review" ? (
          <ActionForm action={decideComplianceRequestComponent} className={styles.decision}>
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="component_id" value={component.id} />
            <label className={styles.commentField}>
              <span className={styles.blockHeading}>{objects.decisionComment}</span>
              <textarea className={styles.comment} name="comments" rows={3} />
            </label>
            <div className={styles.decisionRow}>
              <button className={styles.approve} name="decision" value="approve">{objects.approveObject}</button>
              <button className={styles.hold} type="button" disabled title={objects.returnObjectHold}>
                {objects.returnObject}
              </button>
              <button className={styles.reject} name="decision" value="reject">{objects.rejectObject}</button>
            </div>
          </ActionForm>
        ) : null}
      </CardBody>
    </Card>
  );
}
