import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Stack from "@/components/saqeel/stack/stack";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factory-documents.module.css";
import { Text } from "@/components/saqeel/type";

export type DocumentRow = {
  readonly id: string;
  readonly typeLabel: string;
  readonly title: string;
  readonly reference: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly statusLabel: string;
  readonly statusTone: StatusTone;
};

export type DocumentsStrings = {
  readonly title: string;
  readonly type: string;
  readonly docTitle: string;
  readonly reference: string;
  readonly validFrom: string;
  readonly validTo: string;
  readonly status: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly errorTitle: string;
  readonly previewNote: string;
};

export default function FactoryDocuments({ rows, error, strings }: {
  rows: readonly DocumentRow[];
  error: string | null;
  strings: DocumentsStrings;
}) {
  const columns: DataColumn<DocumentRow>[] = [
    { key: "type", header: strings.type, cell: row => <StatusPill tone="info">{row.typeLabel}</StatusPill> },
    { key: "title", header: strings.docTitle, isRowHeader: true, cell: row => row.title },
    { key: "reference", header: strings.reference, numeric: true, cell: row => <CellMuted>{row.reference}</CellMuted> },
    { key: "validFrom", header: strings.validFrom, numeric: true, align: "end", cell: row => <CellMuted>{row.validFrom}</CellMuted> },
    { key: "validTo", header: strings.validTo, numeric: true, align: "end", cell: row => <CellMuted>{row.validTo}</CellMuted> },
    { key: "status", header: strings.status, cell: row => <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill> },
  ];
  return (
    <Card as="section" labelledBy="documents">
      <CardHeader level="h2" titleId="documents" title={strings.title} />
      <CardBody>
        {error
          ? <EmptyState icon="library" tone="danger" title={strings.errorTitle} description={error} />
          : <Stack gap="default">
              <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "library", title: strings.emptyTitle, description: strings.emptyDescription }} density="compact" />
              {rows.length ? <div className={styles.notice}><Text tone="muted" live="status">{strings.previewNote}</Text></div> : null}
            </Stack>}
      </CardBody>
    </Card>
  );
}
