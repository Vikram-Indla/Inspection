import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import { Mono, Text } from "@/components/saqeel/type";
import type { Decision } from "@/features/admin-compliance-requests/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDateTime } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";

type Copy = Messages["adminComplianceRequests"];

export default function DecisionsTable({ decisions, copy, locale }: {
  decisions: readonly Decision[];
  copy: Copy;
  locale: "en" | "ar";
}) {
  const c = copy.decisions;

  const columns: DataColumn<Decision>[] = [
    { key: "rev", header: c.colRevision, cell: row => <Text as="span" tone="secondary">{fill(copy.common.revisionShort, { n: row.revision_number })}</Text> },
    { key: "decision", header: c.colDecision, cell: row => <Text as="span">{humaniseEnum(row.decision, locale)}</Text> },
    { key: "component", header: c.colComponent, cell: row => <bdi><Mono>{row.component_id ? row.component_id.slice(0, 8) : c.request}</Mono></bdi> },
    { key: "comment", header: c.colComment, cell: row => <Text as="span" tone="secondary" dir="auto">{row.comments ?? copy.common.noValue}</Text> },
    { key: "at", header: c.colAt, cell: row => <Text as="span" tone="secondary">{formatDateTime(row.decided_at, locale)}</Text> },
  ];

  return (
    <DataTable
      rows={decisions}
      columns={columns}
      getRowId={row => row.id}
      empty={{ title: c.empty, icon: "forms" }}
    />
  );
}
