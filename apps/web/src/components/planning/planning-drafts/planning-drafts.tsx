import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { fill } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import { continueDraftHref } from "@/features/planning/links";
import type { PlanningDraftPlan } from "@/features/planning/queries";
import DiscardDraftButton from "@/app/(app)/planning/DiscardDraftButton";

export type PlanningDraftsStrings = {
  heading: string;
  columns: { ref: string; type: string; status: string; createdBy: string; created: string; continue: string; discard: string };
  statusDraft: string;
  continue: string;
  discard: string;
  discardAria: string;
  emptyTitle: string;
};

export default function PlanningDrafts({ drafts, strings, methods, referenceUnavailable, empty, locale, viewerId }: {
  drafts: PlanningDraftPlan[];
  strings: PlanningDraftsStrings;
  methods: Record<string, string>;
  referenceUnavailable: string;
  empty: string;
  locale: Locale;
  viewerId: string | null;
}) {
  if (drafts.length === 0) return null;
  const columns: DataColumn<PlanningDraftPlan>[] = [
    {
      key: "ref",
      header: strings.columns.ref,
      isRowHeader: true,
      cell: draft => <strong>{draft.planReference ?? referenceUnavailable}</strong>,
    },
    { key: "type", header: strings.columns.type, cell: draft => methods[draft.method] ?? draft.method },
    {
      key: "status",
      header: strings.columns.status,
      cell: () => <StatusPill tone="neutral">{strings.statusDraft}</StatusPill>,
    },
    { key: "createdBy", header: strings.columns.createdBy, cell: draft => draft.createdByName ?? empty },
    {
      key: "created",
      header: strings.columns.created,
      numeric: true,
      cell: draft => <CellTime dateTime={draft.createdAt}>{formatDateTime(draft.createdAt, locale)}</CellTime>,
    },
    {
      key: "continue",
      header: strings.columns.continue,
      cell: draft => <CellLink href={continueDraftHref(draft)}>{strings.continue}</CellLink>,
    },
    {
      key: "discard",
      header: strings.columns.discard,
      cell: draft => viewerId && draft.createdBy === viewerId ? (
        <DiscardDraftButton
          planId={draft.id}
          expectedVersion={draft.draftVersion}
          label={strings.discard}
          discardAria={fill(strings.discardAria, { ref: draft.planReference ?? referenceUnavailable })}
        />
      ) : empty,
    },
  ];
  return (
    <Card as="section">
      <CardHeader title={strings.heading} />
      <CardBody>
        <DataTable
          rows={drafts}
          columns={columns}
          getRowId={draft => draft.id}
          empty={{ title: strings.emptyTitle }}
        />
      </CardBody>
    </Card>
  );
}
