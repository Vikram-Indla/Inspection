import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type RiskBand = "high" | "medium" | "low";

export type RiskRow = {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly location: string;
  readonly score: string;
  readonly band: RiskBand | null;
  readonly bandLabel: string;
};

export type RiskStrings = {
  readonly title: string;
  readonly description: string;
  readonly factory: string;
  readonly location: string;
  readonly score: string;
  readonly band: string;
  readonly emptyTitle: string;
  readonly missing: string;
};

const BAND_TONE: Readonly<Record<RiskBand, StatusTone>> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

export default function OperationsRiskTable({ rows, strings }: {
  rows: readonly RiskRow[];
  strings: RiskStrings;
}) {
  const columns: DataColumn<RiskRow>[] = [
    {
      key: "factory", header: strings.factory, isRowHeader: true, width: "grow",
      cell: row => <CellLink href={row.href}><bdi dir="auto">{row.name}</bdi></CellLink>,
    },
    {
      key: "location", header: strings.location,
      cell: row => <CellMuted>{row.location}</CellMuted>,
    },
    { key: "score", header: strings.score, align: "end", numeric: true, cell: row => row.score },
    {
      key: "band", header: strings.band, align: "end", width: "min",
      cell: row => row.band
        ? <StatusPill tone={BAND_TONE[row.band]}>{row.bandLabel}</StatusPill>
        : strings.missing,
    },
  ];

  return (
    <Card as="section" labelledBy="operations-risk">
      <CardHeader
        level="h2"
        titleId="operations-risk"
        title={strings.title}
        description={strings.description}
      />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          empty={{ icon: "risk", title: strings.emptyTitle }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
