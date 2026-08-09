import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { changeKind, statusTone } from "@/features/compliance/presentation";
import type { ApprovalsView, RequestRow } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./approvals-steps.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];

export function requestStatusLabel(status: string, messages: ApprovalsMessages, locale: Locale): string {
  const known = messages.status[status as keyof ApprovalsMessages["status"]];
  return known ?? humaniseEnum(status, locale);
}

function packageChips(view: ApprovalsView, messages: ApprovalsMessages, locale: Locale): readonly string[] {
  const kinds = ["regulation", "inspection_item", "violation", "penalty"] as const;
  const kindChips = kinds
    .map(kind => ({ kind, count: view.selectedComponents.filter(component => component.entity_kind === kind).length }))
    .filter(entry => entry.count > 0)
    .map(entry => `${entry.count} ${humaniseEnum(entry.kind, locale)}`);
  const created = view.selectedComponents.filter(component => changeKind(component) === "created").length;
  const modified = view.selectedComponents.length - created;
  return [
    ...kindChips,
    `${created} ${messages.overview.created}`,
    `${modified} ${messages.overview.modified}`,
  ];
}

export default function ApprovalsOverview({ view, request, messages, locale }: {
  view: ApprovalsView;
  request: RequestRow;
  messages: ApprovalsMessages;
  locale: Locale;
}) {
  const overview = messages.overview;
  return (
    <Card as="section">
      <CardHeader
        title={overview.heading}
        eyebrow={request.request_number}
        trailing={
          <StatusPill tone={statusTone(request.status)}>
            {requestStatusLabel(request.status, messages, locale)}
          </StatusPill>
        }
      />
      <CardBody>
        <DefinitionList columns="two" items={[
          { label: overview.requestNumber, value: request.request_number },
          { label: overview.requestType, value: humaniseEnum(request.request_type, locale) },
          { label: overview.revision, value: fill(messages.requests.revision, { revision: request.current_revision }) },
          {
            label: overview.submitted,
            value: request.submitted_at
              ? formatDateTime(request.submitted_at, locale)
              : messages.requests.submittedUnavailable,
          },
          { label: overview.status, value: requestStatusLabel(request.status, messages, locale) },
        ]} />
        <section aria-label={overview.packageSummary} className={styles.summaryGroup}>
          <h3 className={styles.groupHeading}>{overview.packageSummary}</h3>
          <div className={styles.chipRow}>
            {packageChips(view, messages, locale).map(chip => (
              <span className={styles.chip} key={chip}>{chip}</span>
            ))}
          </div>
        </section>
      </CardBody>
    </Card>
  );
}
