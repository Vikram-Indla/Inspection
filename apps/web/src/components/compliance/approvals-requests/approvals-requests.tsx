import Link from "next/link";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { statusTone } from "@/features/compliance/presentation";
import { approvalsHref } from "@/features/compliance/scope";
import { DECIDED_STATUSES, type ApprovalsView, type RequestRow } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDate } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./approvals-requests.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];

function statusLabel(status: string, messages: ApprovalsMessages, locale: Locale): string {
  const known = messages.status[status as keyof ApprovalsMessages["status"]];
  return known ?? humaniseEnum(status, locale);
}

function RequestCard({ view, row, messages, locale }: {
  view: ApprovalsView;
  row: RequestRow;
  messages: ApprovalsMessages;
  locale: Locale;
}) {
  const requests = messages.requests;
  const current = view.components.filter(component =>
    component.request_id === row.id && component.revision_number === row.current_revision);
  const decided = current.filter(component => DECIDED_STATUSES.has(component.component_status)).length;
  const active = row.id === view.selectedRequest?.id;
  return (
    <article className={styles.card} data-active={active ? "" : undefined}>
      <p className={styles.type}>{humaniseEnum(row.request_type, locale)}</p>
      <h3 className={styles.title}><bdi dir="auto">{row.title}</bdi></h3>
      <p className={styles.version}>
        <span className={styles.code}>{row.request_number}</span>
        {" · "}
        {fill(requests.revision, { revision: row.current_revision })}
      </p>
      <div className={styles.chips}>
        <span className={styles.chip}>{fill(requests.objects, { count: current.length })}</span>
        <span className={styles.chip}>{fill(requests.decided, { done: decided, total: current.length })}</span>
      </div>
      <div className={styles.meta}>
        <span className={styles.metaText}>
          {row.submitted_at
            ? fill(requests.submitted, { date: formatDate(row.submitted_at, locale) })
            : requests.submittedUnavailable}
        </span>
        <StatusPill tone={statusTone(row.status)} size="sm">
          {statusLabel(row.status, messages, locale)}
        </StatusPill>
      </div>
      <Link
        className={styles.open}
        href={approvalsHref(view.scope, { request: row.id, step: null })}
        aria-current={active ? "true" : undefined}
        prefetch={false}
      >
        {active ? requests.selected : requests.openReview}
      </Link>
    </article>
  );
}

export default function ApprovalsRequests({ view, messages, locale }: {
  view: ApprovalsView;
  messages: ApprovalsMessages;
  locale: Locale;
}) {
  return (
    <section className={styles.root} aria-label={messages.requests.label}>
      {view.rows.length === 0 ? (
        <EmptyState
          icon="review"
          title={messages.requests.empty}
          description={messages.requests.emptyBody}
          size="sm"
        />
      ) : view.rows.map(row => (
        <RequestCard view={view} row={row} messages={messages} locale={locale} key={row.id} />
      ))}
    </section>
  );
}
