import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { WorkspaceVersion } from "@/features/regulations/workspace-source";
import { fill } from "@/i18n/messages";
import styles from "./regulation-versions.module.css";

export type RegulationVersionsStrings = {
  readonly caption: string;
  readonly version: string;
  readonly published: string;
  readonly request: string;
  readonly state: string;
  readonly current: string;
  readonly superseded: string;
  readonly versionNumber: string;
  readonly openRequest: string;
  readonly none: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly footnote: string;
};

export default function RegulationVersions({ versions, currentVersionId, requestHref, formatDay, strings }: {
  versions: readonly WorkspaceVersion[];
  currentVersionId: string;
  requestHref: (requestId: string) => string;
  formatDay: (iso: string) => string;
  strings: RegulationVersionsStrings;
}) {
  const absent = <span className={styles.absent}>{strings.none}</span>;

  const columns: readonly DataColumn<WorkspaceVersion>[] = [
    {
      key: "version",
      header: strings.version,
      isRowHeader: true,
      cell: version => <bdi className={styles.code}>{fill(strings.versionNumber, { number: version.version_number })}</bdi>,
    },
    {
      key: "published",
      header: strings.published,
      numeric: true,
      cell: version => version.published_at ? <bdi className={styles.code}>{formatDay(version.published_at)}</bdi> : absent,
    },
    {
      key: "request",
      header: strings.request,
      cell: version => version.request_id
        ? <a className={styles.link} href={requestHref(version.request_id)}>{strings.openRequest}</a>
        : absent,
    },
    {
      key: "state",
      header: strings.state,
      cell: version => version.id === currentVersionId
        ? <StatusPill tone="success">{strings.current}</StatusPill>
        : <StatusPill tone="neutral">{strings.superseded}</StatusPill>,
    },
  ];

  return (
    <>
      <DataTable
        rows={versions}
        columns={columns}
        getRowId={version => version.id}
        getRowSelected={version => version.id === currentVersionId}
        caption={strings.caption}
        density="compact"
        empty={{ title: strings.emptyTitle, description: strings.emptyBody }}
      />
      <p className={styles.footnote}>{strings.footnote}</p>
    </>
  );
}
