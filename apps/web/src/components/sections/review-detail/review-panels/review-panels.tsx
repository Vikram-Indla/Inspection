import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import VersionCompare from "@/components/sections/review-detail/version-compare/version-compare";
import type { ReviewsStrings } from "@/features/reviews/strings";
import type { ActionRow, EvidenceRow, ReviewWorkspace, TimelineEvent, ViolationRow } from "@/features/reviews/detail";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { FACTORY_FIELD_EN } from "@/lib/factory-verification";
import { fill } from "@/i18n/messages";
import styles from "./review-panels.module.css";

type Detail = ReviewsStrings["detail"];
type Check = ReviewWorkspace["factoryChecks"][number];

function Panel({ title, trailing, children }: { title: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card as="section">
      <CardHeader level="h2" title={title} trailing={trailing} />
      <CardBody gap="tight">{children}</CardBody>
    </Card>
  );
}

export default function ReviewPanels({ tab, data, strings, locale }: {
  tab: string;
  data: ReviewWorkspace;
  strings: Detail;
  locale: Locale;
}) {
  const ws = strings.ws;

  if (tab === "evidence") {
    const violationColumns: readonly DataColumn<ViolationRow>[] = [
      { key: "code", header: ws.violations, isRowHeader: true,
        cell: row => <StatusPill tone="danger">{row.violation_codes?.code ?? "—"}</StatusPill> },
      { key: "title", header: ws.colItem, cell: row => <Text as="span" dir="auto">{row.violation_codes?.title ?? "—"}</Text> },
      { key: "mapping", header: ws.mapping, cell: row => <Mono>{row.mapping_version}</Mono> },
    ];
    const actionColumns: readonly DataColumn<ActionRow>[] = [
      { key: "correction", header: ws.actionForms, isRowHeader: true,
        cell: row => <Text as="span" dir="auto">{row.required_correction ?? "—"}</Text> },
      { key: "owner", header: ws.evidenceSource, cell: row => <Text as="span" tone="secondary" dir="auto">{row.owner_name ?? "—"}</Text> },
      { key: "due", header: ws.due, numeric: true,
        cell: row => <Text as="span" tone="secondary" numeric>{row.due_at ? formatDate(row.due_at, locale) : "—"}</Text> },
    ];
    const evidenceColumns: readonly DataColumn<EvidenceRow>[] = [
      { key: "source", header: ws.evidenceSource, isRowHeader: true,
        cell: row => <span className={styles.stack}><Text as="span">{row.linked_type.replace(/_/g, " ")}</Text><Mono>{row.linked_id}</Mono></span> },
      { key: "type", header: ws.evidenceType, cell: row => <Text as="span" tone="secondary">{row.evidence_type.replace(/_/g, " ")}</Text> },
      { key: "reference", header: ws.evidenceReference,
        cell: row => <span className={styles.stack}><Mono>{row.storage_path}</Mono><Mono>{row.content_sha256 ?? ws.hashUnavailable}</Mono></span> },
    ];
    return (
      <Panel title={ws.evidenceHeading}>
        <DataTable rows={data.violations} columns={violationColumns} getRowId={row => row.id} density="compact"
          empty={{ icon: "enforcement", title: ws.trace.unavailable }} />
        <DataTable rows={data.actionForms} columns={actionColumns} getRowId={row => row.id} density="compact"
          empty={{ icon: "forms", title: ws.trace.unavailable }} />
        <DataTable rows={data.evidenceRows} columns={evidenceColumns} getRowId={row => `${row.storage_path}:${row.linked_id}`} density="compact"
          empty={{ icon: "attachment", title: ws.evidenceEmpty }} />
        <Text tone="muted">{ws.mediaPreviewUnavailable}</Text>
      </Panel>
    );
  }

  if (tab === "factory") {
    const columns: readonly DataColumn<Check>[] = [
      { key: "field", header: ws.fvColField, isRowHeader: true,
        cell: row => <Text role="bodyStrong" as="span">{FACTORY_FIELD_EN[row.field_key] ?? row.field_key.replace(/_/g, " ")}</Text> },
      { key: "before", header: ws.fvColBefore, cell: row => <Text as="span" tone="secondary" dir="auto">{row.source_value ?? "—"}</Text> },
      { key: "after", header: ws.fvColAfter, cell: row => <Text as="span" dir="auto">{row.observed_value ?? "—"}</Text> },
      { key: "status", header: ws.fvColStatus,
        cell: row => <StatusPill tone={row.status === "verified" ? "success" : "warning"}>{row.status}</StatusPill> },
      { key: "evidence", header: ws.fvColEvidence, numeric: true,
        cell: row => <Text as="span" tone="secondary" numeric>{data.factoryEvidenceCount(row.id) || "—"}</Text> },
    ];
    return (
      <Panel
        title={ws.fvHeading}
        trailing={
          <StatusPill tone={data.factoryUpdated ? "warning" : "success"}>
            {data.factoryUpdated ? fill(ws.fvChanged, { n: data.factoryUpdated }) : ws.fvNoChanges}
          </StatusPill>
        }
      >
        {data.factoryCheckError
          ? <EmptyState variant="inline" tone="warning" icon="risk" title={ws.fvError} />
          : <DataTable rows={data.factoryChecks} columns={columns} getRowId={row => row.id} density="compact"
            empty={{ icon: "factory", title: ws.fvEmpty }} />}
        <Text tone="muted">{ws.fvNote}</Text>
      </Panel>
    );
  }

  if (tab === "ack") {
    const ack = data.latest?.acknowledgement as
      { name?: string; ts?: string; signed_at?: string; signature_data_url?: string } | null | undefined;
    const signedAt = ack?.signed_at ?? ack?.ts;
    return (
      <Panel title={ws.sigHeading}>
        {ack ? (
          <>
            <Text role="bodyStrong" dir="auto">{ack.name ?? "—"}</Text>
            <Text tone="secondary" numeric>{signedAt ? formatDateTime(signedAt, locale) : "—"}</Text>
            {ack.signature_data_url
              ? <img className={styles.signature} src={ack.signature_data_url} alt={ws.sigAlt} />
              : <Text tone="muted">{ws.sigNone}</Text>}
          </>
        ) : <Text tone="muted">{ws.sigNone}</Text>}
      </Panel>
    );
  }

  if (tab === "compare") {
    if (!data.latest) {
      return (
        <Panel title={strings.cmp.heading}>
          <EmptyState variant="inline" tone="warning" icon="risk"
            title={strings.cmp.sourceUnavailable} description={strings.cmp.sourceUnavailableBody} />
        </Panel>
      );
    }
    return (
      <VersionCompare
        versions={data.compareVersions}
        itemSection={data.itemSection}
        returnedScope={data.returnedScope}
        scopeLabel={data.scopeLabel}
        strings={{ ...strings.cmp, unavailableHeading: strings.cmp.unavailHeading, enumLabels: data.enumLabels }}
      />
    );
  }

  if (tab === "timeline") {
    const columns: readonly DataColumn<TimelineEvent>[] = [
      { key: "at", header: ws.version, isRowHeader: true, numeric: true,
        cell: row => <Text as="span" numeric>{formatDateTime(row.occurred_at, locale)}</Text> },
      { key: "object", header: ws.colItem, cell: row => <Text as="span">{row.object_type.replace(/_/g, " ")}</Text> },
      { key: "event", header: ws.colResponse,
        cell: row => <Text as="span" tone="secondary">{row.event_key.replace(/_/g, " ").toLowerCase()}</Text> },
    ];
    return (
      <Panel title={ws.timelineHeading}>
        {data.timelineError
          ? <EmptyState variant="inline" tone="warning" icon="risk"
            title={ws.timelineUnavailable} description={ws.timelineUnavailableBody} />
          : <DataTable rows={data.timeline} columns={columns} getRowId={row => `${row.event_key}:${row.object_id}`}
            density="compact" empty={{ icon: "workflow", title: ws.trace.unavailable }} />}
        <Text tone="muted">{ws.timelineNote}</Text>
      </Panel>
    );
  }

  if (tab === "prior") {
    return (
      <Panel title={ws.priorDecision}>
        {data.decidedReviews.length === 0
          ? <EmptyState variant="inline" icon="review" title={ws.trace.unavailable} />
          : data.decidedReviews.map(review => (
            <span className={styles.stack} key={review.id}>
              <StatusPill tone="warning">{review.decision ?? "—"}</StatusPill>
              <Text tone="secondary" dir="auto">{review.decision_reason ?? "—"}</Text>
              {review.returned_sections
                ? <Text role="label" tone="muted" as="span">{ws.sections}: {review.returned_sections.join(", ")}</Text>
                : null}
            </span>
          ))}
      </Panel>
    );
  }

  const answerColumns: readonly DataColumn<[string, string]>[] = [
    { key: "item", header: ws.colItem, isRowHeader: true, cell: ([key]) => <Mono>{key}</Mono> },
    { key: "response", header: ws.colResponse,
      cell: ([, value]) => (
        <StatusPill tone={value === "non_compliant" ? "danger" : "success"}>
          {String(value).replace(/_/g, " ")}
        </StatusPill>
      ) },
  ];
  return (
    <Panel title={fill(ws.checklist, { n: data.latest?.version_number ?? "—" })}>
      <DataTable rows={data.answers} columns={answerColumns} getRowId={([key]) => key} density="compact"
        empty={{ icon: "forms", title: ws.trace.empty }} />
    </Panel>
  );
}
