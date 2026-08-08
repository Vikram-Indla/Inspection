import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

const MISSING = "—";

export type InspectionHistoryRow = {
  readonly id: string;
  readonly visitHref: string;
  readonly visitShort: string;
  readonly visitType: string;
  readonly window: string;
  readonly windowIso: string;
  readonly planningLabel: string;
  readonly operationalLabel: string;
  readonly inspectionLabel: string | null;
  readonly versions: readonly number[];
  readonly reportHref: string | null;
  readonly violations: readonly { readonly key: string; readonly code: string }[];
  readonly actions: string | null;
  readonly reviews: readonly { readonly key: string; readonly label: string; readonly tone: StatusTone }[];
};

export type InspectionHistoryStrings = {
  readonly title: string;
  readonly visit: string;
  readonly window: string;
  readonly planning: string;
  readonly operational: string;
  readonly inspection: string;
  readonly versions: string;
  readonly violations: string;
  readonly actions: string;
  readonly review: string;
  readonly report: string;
  readonly restricted: string;
  readonly emptyTitle: string;
};

export default function FactoryInspectionHistory({ rows, sensitive, strings }: {
  rows: readonly InspectionHistoryRow[];
  sensitive: boolean;
  strings: InspectionHistoryStrings;
}) {
  const columns: DataColumn<InspectionHistoryRow>[] = [
    {
      key: "visit", header: strings.visit, isRowHeader: true,
      cell: row => <><CellLink href={row.visitHref}><bdi>{row.visitShort}</bdi></CellLink> <CellMuted>{row.visitType}</CellMuted></>,
    },
    { key: "window", header: strings.window, numeric: true, cell: row => <CellTime dateTime={row.windowIso}>{row.window}</CellTime> },
    { key: "planning", header: strings.planning, cell: row => <StatusPill tone="neutral">{row.planningLabel}</StatusPill> },
    { key: "operational", header: strings.operational, cell: row => <StatusPill tone="neutral">{row.operationalLabel}</StatusPill> },
    { key: "inspection", header: strings.inspection, cell: row => row.inspectionLabel ? <StatusPill tone="info">{row.inspectionLabel}</StatusPill> : MISSING },
    {
      key: "versions", header: strings.versions,
      cell: row => <>{row.versions.length ? <CellMuted>{row.versions.map(n => `v${n}`).join(" ")}</CellMuted> : null}{row.reportHref ? <> <CellLink href={row.reportHref}>{strings.report}</CellLink></> : null}</>,
    },
    {
      key: "violations", header: strings.violations,
      cell: row => sensitive ? row.violations.map(v => <StatusPill key={v.key} tone="danger">{v.code}</StatusPill>) : <CellMuted>{strings.restricted}</CellMuted>,
    },
    {
      key: "actions", header: strings.actions, width: "grow",
      cell: row => sensitive ? <CellMuted>{row.actions ?? MISSING}</CellMuted> : <CellMuted>{strings.restricted}</CellMuted>,
    },
    {
      key: "review", header: strings.review,
      cell: row => sensitive ? row.reviews.map(r => <StatusPill key={r.key} tone={r.tone}>{r.label}</StatusPill>) : <CellMuted>{strings.restricted}</CellMuted>,
    },
  ];
  return (
    <Card as="section" labelledBy="history">
      <CardHeader level="h2" titleId="history" title={strings.title} />
      <CardBody>
        <DataTable rows={rows} columns={columns} getRowId={row => row.id} empty={{ icon: "calendar", title: strings.emptyTitle }} density="compact" />
      </CardBody>
    </Card>
  );
}
