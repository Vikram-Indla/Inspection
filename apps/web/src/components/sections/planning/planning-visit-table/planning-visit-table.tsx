import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { CellLink, CellMuted, CellTime, type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type PlanningVisitDisplayRow = {
  readonly id: string;
  readonly reference: string;
  readonly href: string;
  readonly planningType: string;
  readonly statusLabel: string;
  readonly statusTone: StatusTone;
  readonly operationalState: string;
  readonly visitType: string;
  readonly visitMode: string;
  readonly priority: string;
  readonly crNumber: string;
  readonly licenceNumber: string;
  readonly factoryName: string;
  readonly region: string;
  readonly city: string;
  readonly inspector: string;
  readonly windowStart: string;
  readonly windowStartIso: string;
  readonly windowEnd: string;
  readonly windowEndIso: string;
  readonly executionDate: string;
  readonly packages: string;
  readonly createdBy: string;
  readonly createdDate: string;
  readonly createdDateIso: string;
  readonly sourceChannel: string;
  readonly returnStatus: string;
  readonly bulkPlanRef: string;
  readonly lastUpdate: string;
};

export type PlanningVisitTableStrings = {
  readonly caption: string;
  readonly reference: string;
  readonly planningType: string;
  readonly planningStatus: string;
  readonly operationalState: string;
  readonly visitType: string;
  readonly visitMode: string;
  readonly priority: string;
  readonly crNumber: string;
  readonly licenceNumber: string;
  readonly factoryName: string;
  readonly region: string;
  readonly city: string;
  readonly inspector: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly executionDate: string;
  readonly packages: string;
  readonly createdBy: string;
  readonly createdDate: string;
  readonly sourceChannel: string;
  readonly returnStatus: string;
  readonly bulkPlanRef: string;
  readonly lastUpdate: string;
  readonly emptyTitle: string;
};

export default function PlanningVisitTable({ rows, strings }: {
  rows: readonly PlanningVisitDisplayRow[];
  strings: PlanningVisitTableStrings;
}) {
  const columns: DataColumn<PlanningVisitDisplayRow>[] = [
    { key: "reference", header: strings.reference, isRowHeader: true, numeric: true, cell: row => <CellLink href={row.href}><bdi>{row.reference}</bdi></CellLink> },
    { key: "planningType", header: strings.planningType, cell: row => row.planningType },
    { key: "planningStatus", header: strings.planningStatus, cell: row => <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill> },
    { key: "operationalState", header: strings.operationalState, cell: row => row.operationalState },
    { key: "visitType", header: strings.visitType, cell: row => row.visitType },
    { key: "visitMode", header: strings.visitMode, cell: row => row.visitMode },
    { key: "priority", header: strings.priority, cell: row => row.priority },
    { key: "crNumber", header: strings.crNumber, numeric: true, cell: row => <CellMuted>{row.crNumber}</CellMuted> },
    { key: "licenceNumber", header: strings.licenceNumber, numeric: true, cell: row => <CellMuted>{row.licenceNumber}</CellMuted> },
    { key: "factoryName", header: strings.factoryName, width: "grow", cell: row => row.factoryName },
    { key: "region", header: strings.region, cell: row => row.region },
    { key: "city", header: strings.city, cell: row => row.city },
    { key: "inspector", header: strings.inspector, width: "grow", cell: row => row.inspector },
    { key: "windowStart", header: strings.windowStart, numeric: true, cell: row => <CellTime dateTime={row.windowStartIso}>{row.windowStart}</CellTime> },
    { key: "windowEnd", header: strings.windowEnd, numeric: true, cell: row => <CellTime dateTime={row.windowEndIso}>{row.windowEnd}</CellTime> },
    { key: "executionDate", header: strings.executionDate, numeric: true, cell: row => <CellMuted>{row.executionDate}</CellMuted> },
    { key: "packages", header: strings.packages, width: "grow", cell: row => row.packages },
    { key: "createdBy", header: strings.createdBy, cell: row => row.createdBy },
    { key: "createdDate", header: strings.createdDate, numeric: true, cell: row => <CellTime dateTime={row.createdDateIso}>{row.createdDate}</CellTime> },
    { key: "sourceChannel", header: strings.sourceChannel, cell: row => row.sourceChannel },
    { key: "returnStatus", header: strings.returnStatus, cell: row => row.returnStatus },
    { key: "bulkPlanRef", header: strings.bulkPlanRef, numeric: true, cell: row => <CellMuted>{row.bulkPlanRef}</CellMuted> },
    { key: "lastUpdate", header: strings.lastUpdate, numeric: true, cell: row => <CellMuted>{row.lastUpdate}</CellMuted> },
  ];
  return (
    <Card as="section" labelledBy="planning-visit-heading">
      <CardHeader level="h2" titleId="planning-visit-heading" title={strings.caption} />
      <CardBody>
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          empty={{ icon: "calendar", title: strings.emptyTitle }}
          density="compact"
        />
      </CardBody>
    </Card>
  );
}
