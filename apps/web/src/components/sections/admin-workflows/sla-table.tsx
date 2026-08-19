"use client";

import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import type { AdminWorkflowsMessages } from "@/features/admin-workflows/strings";
import type { SlaCalendar } from "@/features/admin-workflows/types";

export default function SlaTable({ calendars, strings }: {
  calendars: readonly SlaCalendar[];
  strings: AdminWorkflowsMessages;
}) {
  const s = strings.sla;
  const nc = strings.notConfigured;
  const columns: readonly DataColumn<SlaCalendar>[] = [
    { key: "calendar", header: s.calendar, isRowHeader: true, cell: c => (
      <Text as="span" role="bodyStrong">{c.name} <Mono>{c.version_label ?? ""}</Mono></Text>
    ) },
    { key: "days", header: s.workingDays, cell: c => (c.working_days ?? []).length
      ? <Text as="span" role="mono" dir="ltr">{(c.working_days ?? []).join(", ")}</Text>
      : <Text as="span" tone="muted">{nc}</Text> },
    { key: "hours", header: s.hours, cell: c => c.working_start && c.working_end
      ? <Text as="span" role="mono" dir="ltr">{`${c.working_start}–${c.working_end}`}</Text>
      : <Text as="span" tone="muted">{nc}</Text> },
    { key: "timezone", header: s.timezone, cell: c => c.timezone
      ? <Text as="span">{c.timezone}</Text>
      : <Text as="span" tone="muted">{nc}</Text> },
    { key: "activation", header: s.activation, cell: c => (
      <StatusPill tone={c.activation_authorized ? "success" : "warning"}>{c.activation_authorized ? s.authorized : s.pending}</StatusPill>
    ) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={calendars}
      getRowId={c => c.id}
      empty={{ icon: "calendar", title: strings.sla.none }}
      bleed={false}
    />
  );
}
