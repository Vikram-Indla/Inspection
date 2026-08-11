import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./operations-entry-table.module.css";
import { Mono, Text } from "@/components/saqeel/type";

export type EntryRow = {
  readonly id: string;
  readonly inspectorName: string | null;
  readonly state: string;
  readonly visitId: string | null;
  readonly factoryName: string;
  readonly region: string | null;
  readonly city: string | null;
  readonly riskScore: string | number | null;
  readonly lastGeoAt: string | null;
  readonly href: string;
};

export type EntryTableStrings = {
  readonly title: string;
  readonly caption: string;
  readonly inspector: string;
  readonly state: string;
  readonly visit: string;
  readonly factory: string;
  readonly location: string;
  readonly risk: string;
  readonly lastUpdate: string;
  readonly actions: string;
  readonly openRecord: string;
  readonly notConfigured: string;
  readonly emptyTitle: string;
};

const MISSING = "—";
const ID_PREVIEW = 8;

export default function OperationsEntryTable({ rows, strings }: {
  rows: readonly EntryRow[];
  strings: EntryTableStrings;
}) {
  const columns: DataColumn<EntryRow>[] = [
    {
      key: "inspector", header: strings.inspector, isRowHeader: true,
      cell: row => row.inspectorName ?? MISSING,
    },
    {
      key: "state", header: strings.state,
      cell: row => <StatusPill tone="info">{row.state}</StatusPill>,
    },
    {
      key: "visit", header: strings.visit, numeric: true,
      cell: row => <Mono><bdi>{row.visitId?.slice(0, ID_PREVIEW) ?? MISSING}</bdi></Mono>,
    },
    { key: "factory", header: strings.factory, cell: row => row.factoryName },
    {
      key: "location", header: strings.location,
      cell: row => [row.region, row.city].filter(Boolean).join(" · ") || MISSING,
    },
    {
      key: "risk", header: strings.risk, align: "end", numeric: true,
      cell: row => row.riskScore === null
        ? <StatusPill tone="warning" ping>{strings.notConfigured}</StatusPill>
        : row.riskScore,
    },
    {
      key: "lastUpdate", header: strings.lastUpdate, numeric: true,
      cell: row => <Text as="span" tone="muted">{row.lastGeoAt ?? MISSING}</Text>,
    },
    {
      key: "actions", header: strings.actions, align: "end", width: "min",
      cell: row => (
        <Button variant="secondary" size="sm" href={row.href} label={`${strings.openRecord} — ${row.factoryName}`}>
          {strings.openRecord}
        </Button>
      ),
    },
  ];

  return (
    <Card as="section" labelledBy="operations-entry-table">
      <CardHeader level="h2" titleId="operations-entry-table" title={strings.title} description={strings.caption} />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          empty={{ icon: "radar", title: strings.emptyTitle }}
        />
      </CardBody>
    </Card>
  );
}
