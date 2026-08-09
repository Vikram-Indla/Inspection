import ActionForm from "@/app/(app)/admin/compliance-requests/ActionForm";
import {
  publishComplianceRequest,
  rejectComplianceRequest,
  returnComplianceRequest,
} from "@/app/(app)/admin/compliance-requests/actions";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import Timeline from "@/components/saqeel/timeline/timeline";
import { groupBreakdown, stepComponents } from "@/features/compliance/presentation";
import type { ApprovalsView, RequestRow } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./approvals-side.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];
type SideProps = { view: ApprovalsView; request: RequestRow; messages: ApprovalsMessages; locale: Locale };

function Progress({ view, messages }: { view: ApprovalsView; messages: ApprovalsMessages }) {
  const groups = ["regulation", "inspection_item", "violation", "penalty"] as const;
  const overall = groupBreakdown(view.selectedComponents);
  return (
    <section className={styles.panel} aria-label={messages.side.progress}>
      <h3 className={styles.panelLabel}>{messages.side.progress}</h3>
      {groups.map(group => {
        const scoped = stepComponents(view.selectedComponents, group);
        if (!scoped.length) return null;
        const breakdown = groupBreakdown(scoped);
        return (
          <div className={styles.progressGroup} key={group}>
            <span className={styles.progressLabel}>{messages.steps[group]}</span>
            <span className={styles.progressDetail}>
              {fill(messages.requests.decided, { done: breakdown.decided, total: breakdown.total })}
            </span>
          </div>
        );
      })}
      <p className={styles.overall}>
        {fill(messages.side.overall, { done: overall.decided, total: overall.total })}
      </p>
    </section>
  );
}

function Decision({ view, request, messages }: SideProps) {
  const side = messages.side;
  return (
    <section className={styles.panel} aria-label={side.decision}>
      <h3 className={styles.panelLabel}>{side.decision}</h3>
      {view.selectedReadFailed ? (
        <p className={styles.blocked} role="alert">{side.objectUnavailable}</p>
      ) : null}
      {!view.canReview ? (
        <p className={styles.note}>{side.readOnly}</p>
      ) : (
        <>
          <p className={view.allDecided ? styles.ready : styles.blocked}>
            {view.allDecided ? side.packageReady : side.packageBlocked}
          </p>
          <ActionForm action={publishComplianceRequest} className={styles.form}>
            <input type="hidden" name="request_id" value={request.id} />
            <button className={styles.publish} type="submit" disabled={!view.publishable}>{side.publish}</button>
          </ActionForm>
          <ActionForm action={returnComplianceRequest} className={styles.form}>
            <input type="hidden" name="request_id" value={request.id} />
            <label className={styles.field}>
              <span className={styles.panelLabel}>{side.returnReason}</span>
              <textarea className={styles.comment} name="comments" required rows={3} />
            </label>
            <button className={styles.secondary} type="submit" disabled={!view.packageReviewable}>
              {side.returnPackage}
            </button>
          </ActionForm>
          <ActionForm action={rejectComplianceRequest} className={styles.form}>
            <input type="hidden" name="request_id" value={request.id} />
            <label className={styles.field}>
              <span className={styles.panelLabel}>{side.rejectionReason}</span>
              <textarea className={styles.comment} name="comments" required rows={3} />
            </label>
            <button className={styles.danger} type="submit" disabled={!view.packageReviewable}>
              {side.rejectPackage}
            </button>
          </ActionForm>
        </>
      )}
      <DefinitionList items={[
        { label: side.correlation, value: <span className={styles.receipt}>{request.correlation_id}</span> },
        {
          label: side.auditReceipts,
          value: Array.isArray(request.audit_references) ? request.audit_references.length : side.unavailable,
        },
        {
          label: side.publicationReceipt,
          value: request.publication_audit_reference ?? side.notPublished,
        },
      ]} />
    </section>
  );
}

function History({ view, messages, locale }: { view: ApprovalsView; messages: ApprovalsMessages; locale: Locale }) {
  const side = messages.side;
  const events = [
    ...view.decisions.map(decision => ({
      id: decision.id,
      title: humaniseEnum(decision.decision, locale),
      dateTime: decision.decided_at,
      time: formatDateTime(decision.decided_at, locale),
      meta: decision.component_id
        ? fill(side.objectDecision, { reference: decision.component_id.slice(0, 8) })
        : side.packageDecision,
      detail: decision.comments ?? undefined,
    })),
    ...view.publications.map(publication => ({
      id: publication.id,
      title: side.versionPublished,
      dateTime: publication.published_at,
      time: formatDateTime(publication.published_at, locale),
      meta: publication.version_id,
    })),
  ];
  return (
    <section className={styles.panel} aria-label={side.timeline}>
      <h3 className={styles.panelLabel}>{side.timeline}</h3>
      {events.length ? <Timeline events={events} label={side.timeline} /> : <p className={styles.note}>{side.noHistory}</p>}
    </section>
  );
}

export default function ApprovalsSide(props: SideProps) {
  return (
    <div className={styles.sticky}>
      <Progress view={props.view} messages={props.messages} />
      <Decision {...props} />
      <History view={props.view} messages={props.messages} locale={props.locale} />
    </div>
  );
}
