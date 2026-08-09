import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { RegulationFootprint, RegulationRow } from "@/features/regulations/rows";
import { fill } from "@/i18n/messages";
import styles from "./regulation-catalogue.module.css";

export type RegulationCatalogueStrings = {
  readonly caption: string;
  readonly regulation: string;
  readonly authority: string;
  readonly clauses: string;
  readonly items: string;
  readonly violations: string;
  readonly status: string;
  readonly version: string;
  readonly published: string;
  readonly open: string;
  readonly openLabel: string;
  readonly selected: string;
  readonly unknown: string;
  readonly unknownHint: string;
  readonly none: string;
  readonly incomplete: string;
  readonly notRecorded: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

export default function RegulationCatalogue({ rows, selectedId, statusLabelFor, hrefFor, formatDay, strings }: {
  rows: readonly RegulationRow[];
  selectedId: string;
  statusLabelFor: (status: string) => string;
  hrefFor: (row: RegulationRow) => string;
  formatDay: (iso: string) => string;
  strings: RegulationCatalogueStrings;
}) {
  const count = (value: RegulationFootprint) => value === "unknown"
    ? <span className={styles.unknown} title={strings.unknownHint}>{strings.unknown}</span>
    : value === 0
      ? <span className={styles.none}>{strings.none}</span>
      : <bdi>{value}</bdi>;

  const columns: readonly DataColumn<RegulationRow>[] = [
    {
      key: "regulation",
      header: strings.regulation,
      isRowHeader: true,
      cell: row => (
        <span className={styles.identity}>
          <span className={styles.title}>{row.title}</span>
          <bdi className={styles.code}>{row.code}</bdi>
          {row.incomplete ? <span className={styles.warning}>{strings.incomplete}</span> : null}
        </span>
      ),
    },
    {
      key: "authority",
      header: strings.authority,
      cell: row => row.authority ?? <span className={styles.none}>{strings.notRecorded}</span>,
    },
    { key: "clauses", header: strings.clauses, align: "end", numeric: true, cell: row => count(row.clauses) },
    { key: "items", header: strings.items, align: "end", numeric: true, cell: row => count(row.items) },
    { key: "violations", header: strings.violations, align: "end", numeric: true, cell: row => count(row.violations) },
    {
      key: "status",
      header: strings.status,
      cell: row => <StatusPill tone={row.tone}>{statusLabelFor(row.status)}</StatusPill>,
    },
    { key: "version", header: strings.version, cell: row => <bdi className={styles.code}>{row.versionLabel}</bdi> },
    {
      key: "published",
      header: strings.published,
      numeric: true,
      cell: row => row.publishedAt
        ? <bdi className={styles.code}>{formatDay(row.publishedAt)}</bdi>
        : <span className={styles.none}>{strings.none}</span>,
    },
    {
      key: "open",
      header: strings.open,
      width: "min",
      cell: row => (
        <Link className={styles.open} href={hrefFor(row)} aria-label={fill(strings.openLabel, { code: row.code })}>
          {row.id === selectedId ? strings.selected : strings.open}
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      getRowSelected={row => row.id === selectedId}
      caption={strings.caption}
      density="compact"
      empty={{ icon: "search", title: strings.emptyTitle, description: strings.emptyBody }}
    />
  );
}
