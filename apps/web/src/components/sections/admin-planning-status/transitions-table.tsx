import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { WorkflowTransition } from "@/features/admin-planning-status/data";
import type { Messages } from "@/i18n/messages";
import { humaniseEnum } from "@/lib/text";

type Copy = Messages["adminPlanningStatus"];
type TransitionRow = WorkflowTransition & { rowId: string };

export default function TransitionsTable({ transitions, isFallback, locale, copy }: {
  transitions: readonly WorkflowTransition[];
  isFallback: boolean;
  locale: "en" | "ar";
  copy: Copy;
}) {
  const c = copy.columns;

  const stateLabel = (key?: string): string =>
    key ? (copy.states[key as keyof typeof copy.states] ?? humaniseEnum(key, locale)) : copy.noValue;
  const actorLabel = (key?: string): string =>
    key ? (copy.actors[key as keyof typeof copy.actors] ?? humaniseEnum(key, locale)) : copy.noValue;
  const guardText = (transition: WorkflowTransition): string => {
    if (isFallback && transition.id) {
      return copy.fallback.guards[transition.id as keyof typeof copy.fallback.guards] ?? transition.guard ?? copy.noValue;
    }
    return transition.guard ?? copy.noValue;
  };

  const rows: TransitionRow[] = transitions.map((transition, index) => ({
    ...transition,
    rowId: transition.id ?? String(index),
  }));

  const columns: DataColumn<TransitionRow>[] = [
    { key: "from", header: c.from, cell: row => <Text as="span" dir="auto">{stateLabel(row.from)}</Text> },
    {
      key: "to",
      header: c.to,
      cell: row => <StatusPill tone="info" ping={false}>{stateLabel(row.to)}</StatusPill>,
    },
    { key: "actor", header: c.actor, cell: row => <Text as="span" dir="auto">{actorLabel(row.actor)}</Text> },
    { key: "guard", header: c.guard, cell: row => <Text as="span" tone="secondary" dir="auto">{guardText(row)}</Text> },
    {
      key: "terminal",
      header: c.terminal,
      cell: row => <Text as="span" tone={row.terminal ? "primary" : "muted"}>{row.terminal ? copy.yes : copy.no}</Text>,
    },
    {
      key: "sideEffects",
      header: c.sideEffects,
      cell: row => row.side_effects?.length
        ? <Text as="span" tone="secondary" dir="auto">{row.side_effects.join(" · ")}</Text>
        : <Text as="span" tone="muted">{copy.noValue}</Text>,
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={row => row.rowId}
      empty={{ title: copy.emptyTransitions, icon: "forms" }}
    />
  );
}
