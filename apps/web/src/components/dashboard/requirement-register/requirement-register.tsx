"use client";

import Button from "@/components/saqeel/button/button";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { MetricStripStrings } from "@/features/dashboard/strip";
import type { DisplayTone, MetricDisplay, MethodologyEntry } from "@/app/(app)/dashboard/dashboard-format";
import { useExplain } from "../explain-panel/explain-panel";

const TONE: Readonly<Record<DisplayTone, StatusTone>> = {
  critical: "danger",
  warning: "warning",
  success: "success",
  info: "info",
  neutral: "neutral",
};

export type RequirementRegisterStrings = MetricStripStrings & {
  readonly measure: string;
  readonly state: string;
  readonly emptyTitle: string;
};

export default function RequirementRegister({ metrics, methodology, strings }: {
  metrics: readonly MetricDisplay[];
  methodology: Readonly<Record<string, MethodologyEntry>>;
  strings: RequirementRegisterStrings;
}) {
  const { openEntry, activeId } = useExplain();
  const ordered = [...metrics].sort(
    (first, second) => Number(first.kind === "status") - Number(second.kind === "status"),
  );

  const columns: DataColumn<MetricDisplay>[] = [
    {
      key: "measure", header: strings.measure, isRowHeader: true,
      cell: metric => <Text as="span">{metric.title}</Text>,
    },
    {
      key: "state", header: strings.state, align: "end", numeric: true,
      cell: metric => metric.kind === "status"
        ? <StatusPill tone={TONE[metric.tone]} ping>{metric.text}</StatusPill>
        : <Text as="span" role="bodyStrong" numeric>{metric.text}</Text>,
    },
    {
      key: "basis", header: "", align: "end", width: "min",
      cell: metric => {
        const entry = methodology[metric.metricId];
        if (!entry) return null;
        const label = metric.kind === "status" ? strings.why : strings.methodology;
        return (
          <Button
            variant="tertiary" size="sm" hasPopup="dialog" compactLabel
            expanded={activeId === metric.metricId}
            label={`${label} — ${metric.title}`}
            onClick={() => openEntry(entry)}
          >
            {label}
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      rows={ordered}
      columns={columns}
      getRowId={metric => metric.metricId}
      empty={{ icon: "radar", title: strings.emptyTitle }}
    />
  );
}
