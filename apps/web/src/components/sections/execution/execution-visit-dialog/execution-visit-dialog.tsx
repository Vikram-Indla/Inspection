"use client";

import Button from "@/components/saqeel/button/button";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import ExecutionDialog from "@/components/sections/execution/execution-dialog/execution-dialog";
import type { ExecutionVisitDetailRead } from "@/app/(app)/execution/read-model";
import type { ExecutionLabels } from "@/features/execution/labels";
import type { ExecutionMessages } from "@/features/execution/strings";
import type { ExecutionRow } from "@/features/execution/types";

export default function ExecutionVisitDialog({
  row, detail, isMine, strings, table, labels, onClose,
}: {
  row: ExecutionRow;
  detail: ExecutionVisitDetailRead | null;
  isMine: boolean;
  strings: ExecutionMessages["detail"];
  table: ExecutionMessages["table"];
  labels: ExecutionLabels;
  onClose: () => void;
}) {
  const place = [row.region, row.city].filter(Boolean).join(" · ");
  const hasCoordinates = row.lat != null && row.lng != null;
  const journey = row.journeyStatus
    ? `${labels.enumLabel(row.journeyStatus)} · ${labels.dateTime(row.journeyStartedAt)}`
    : strings.noJourney;

  const base: Definition[] = [
    { label: strings.planningWindow, value: labels.range(row.windowStart, row.windowEnd) },
    { label: strings.executionDate, value: labels.date(row.executionDate) },
    { label: strings.visitTypeMode, value: `${labels.enumLabel(row.visitType)} · ${labels.enumLabel(row.visitMode)}` },
    { label: strings.inspector, value: row.inspector ?? table.unassigned },
    { label: strings.assignment, value: `${labels.enumLabel(row.assignmentStatus)} · ${labels.enumLabel(row.assignmentMethod)}` },
    { label: strings.regionCity, value: place || table.notRecorded },
    { label: strings.riskPriority, value: `${labels.enumLabel(row.risk)} · ${labels.enumLabel(row.priority)}` },
    { label: strings.preparation, value: labels.enumLabel(row.planningStatus) },
    {
      label: strings.reportPackage,
      value: [row.packageCode, row.reportType, row.packageVersion].filter(Boolean).join(" · ") || table.notConfigured,
    },
    { label: strings.locationData, value: hasCoordinates ? table.coordinatesRecorded : table.coordinatesMissing },
    { label: strings.journey, value: journey },
    { label: strings.offline, value: strings.offlineBody },
  ];

  const items: Definition[] = detail?.status === "ok"
    ? [
        ...base,
        { label: strings.planningVersion, value: detail.visit.planningVersion ?? strings.unavailable },
        { label: strings.packageState, value: labels.enumLabel(detail.visit.packageStatus) },
        { label: strings.planningNote, value: detail.visit.notes ?? strings.noNote },
      ]
    : base;

  const openLabel = isMine
    ? row.operationalState === "new" ? strings.prepare : strings.openInspector
    : strings.openVisit;

  return (
    <ExecutionDialog
      id="execution-detail-title"
      title={row.factory}
      eyebrow={strings.eyebrow}
      closeLabel={strings.close}
      busy={detail === null}
      onClose={onClose}
      footer={
        <>
          {detail?.status === "ok" ? (
            <Button variant="primary" size="sm" label={openLabel}
              href={isMine ? `/field/${row.id}` : `/visits/${row.id}`}>
              {openLabel}
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" label={strings.closeAction} onClick={onClose}>
            {strings.closeAction}
          </Button>
        </>
      }
    >
      {detail === null ? <Text tone="muted" live="status">{strings.refreshing}</Text> : null}
      {detail?.status === "not_found_or_denied"
        ? <EmptyState variant="inline" tone="danger" icon="risk" title={strings.notFound} />
        : null}
      {detail?.status === "invalid"
        ? <EmptyState variant="inline" tone="warning" icon="risk" title={strings.unverified} />
        : null}
      <Text tone="muted">{strings.windowNote}</Text>
      <DefinitionList items={items} columns="two" />
    </ExecutionDialog>
  );
}
