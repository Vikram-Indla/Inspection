import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import Pagination from "@/components/saqeel/pagination/pagination";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono, Text } from "@/components/saqeel/type";
import { fill } from "@/i18n/messages";
import { mapHref, placeLabel, MAP_PAGE_SIZE, type VisitMapFilter, type VisitMapRow, type VisitMapStrings } from "@/features/visits/map";
import styles from "./visit-map-table.module.css";

export default function VisitMapTable({ rows, page, pageCount, total, filter, basePath, strings }: {
  rows: readonly VisitMapRow[];
  page: number;
  pageCount: number;
  total: number;
  filter: VisitMapFilter;
  basePath: string;
  strings: VisitMapStrings;
}) {
  const anyInspectorLocated = rows.some(row => row.inspectorLocation !== null);

  const columns: readonly DataColumn<VisitMapRow>[] = [
    {
      key: "visit",
      header: strings.colVisit,
      isRowHeader: true,
      cell: row => (
        <Link className={styles.reference} href={`/visits/${row.id}`} prefetch={false}>
          <Mono>{row.reference}</Mono>
        </Link>
      ),
    },
    {
      key: "factory",
      header: strings.colFactory,
      cell: row => (
        <Link className={styles.reference} href={`/factories/${row.factoryId}`} prefetch={false}>
          <Text as="span" dir="auto">{row.factoryName}</Text>
        </Link>
      ),
    },
    {
      key: "place",
      header: strings.colRegionCity,
      cell: row => <Text as="span" dir="auto">{placeLabel(row.region, row.city)}</Text>,
    },
    ...(anyInspectorLocated ? [{
      key: "inspector",
      header: strings.colInspector,
      cell: (row: VisitMapRow) => row.inspectorLocation === null
        ? <Text as="span" tone="muted">{strings.unavailableScope}</Text>
        : <Text as="span" dir="auto">{row.inspectorLocation}</Text>,
    }] : []),
    {
      key: "state",
      header: strings.colState,
      width: "min",
      cell: row => <StatusPill tone={row.stateTone}>{row.stateLabel}</StatusPill>,
    },
  ];

  return (
    <div className={styles.root}>
      {anyInspectorLocated ? null : <Text tone="muted">{strings.inspectorScopeNote}</Text>}
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={row => row.id}
        caption={strings.tableCaption}
        empty={{ icon: "map", title: strings.tableEmptyTitle, description: strings.tableEmptyBody }}
      />
      {pageCount > 1 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          pageSize={MAP_PAGE_SIZE}
          total={total}
          strings={{
            previous: strings.pagePrevious,
            next: strings.pageNext,
            status: strings.pageStatus,
            label: strings.pageLabel,
          }}
          hrefFor={next => mapHref(basePath, filter, next)}
        />
      ) : null}
    </div>
  );
}
