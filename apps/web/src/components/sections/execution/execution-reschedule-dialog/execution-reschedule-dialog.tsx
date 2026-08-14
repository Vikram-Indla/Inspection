"use client";

import Button from "@/components/saqeel/button/button";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import { Text } from "@/components/saqeel/type";
import ExecutionDialog from "@/components/sections/execution/execution-dialog/execution-dialog";
import type { ExecutionLabels } from "@/features/execution/labels";
import type { ExecutionMessages } from "@/features/execution/strings";
import type { RescheduleRequest } from "@/features/execution/types";
import { fill } from "@/i18n/messages";

export default function ExecutionRescheduleDialog({
  request, strings, labels, onClose,
}: {
  request: RescheduleRequest;
  strings: ExecutionMessages["reschedule"];
  labels: ExecutionLabels;
  onClose: () => void;
}) {
  const { row, date } = request;
  const lead = date
    ? fill(strings.droppedOn, { factory: row.factory, date: labels.date(date) })
    : fill(strings.requested, { factory: row.factory });

  const items: Definition[] = [
    { label: strings.currentWindow, value: labels.range(row.windowStart, row.windowEnd) },
  ];

  return (
    <ExecutionDialog
      id="execution-reschedule-title"
      title={fill(strings.title, { reference: row.visitReference })}
      eyebrow={strings.eyebrow}
      closeLabel={strings.close}
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" size="sm" href={`/planning/visits/${row.id}`} label={strings.continue}>
            {strings.continue}
          </Button>
          <Button variant="secondary" size="sm" label={strings.cancel} onClick={onClose}>
            {strings.cancel}
          </Button>
        </>
      }
    >
      <Text>{lead}</Text>
      <DefinitionList items={items} />
      <Text tone="muted">{strings.workflowNote}</Text>
      <Text tone="muted">{strings.noHandoff}</Text>
    </ExecutionDialog>
  );
}
