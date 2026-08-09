import DataTable, { CellMuted } from "@/components/saqeel/data-table/data-table";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { ListRow, ListRows } from "@/components/saqeel/list-row/list-row";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import Timeline from "@/components/saqeel/timeline/timeline";
import { statusTone, violationLevelTone } from "@/features/compliance/presentation";
import type { LibraryView, RegulationRow } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import { formatDate, formatDateTime } from "@/lib/dates";
import { humaniseEnum } from "@/lib/text";
import type { Locale } from "@/lib/i18n";
import styles from "./library-panels.module.css";

type LibraryMessages = Messages["compliance"]["library"];
type PanelProps = { view: LibraryView; selected: RegulationRow; messages: LibraryMessages; locale: Locale };

function Unavailable({ title, body }: { title: string; body: string }) {
  return <EmptyState tone="warning" icon="risk" title={title} description={body} size="sm" />;
}

function Overview({ view, selected, messages, locale }: PanelProps) {
  const overview = messages.overview;
  const unavailable = messages.workspace.countUnavailable;
  return (
    <div className={styles.groups}>
      <section className={styles.group} aria-label={overview.general}>
        <h3 className={styles.groupHeading}>{overview.general}</h3>
        <DefinitionList columns="two" items={[
          { label: overview.name, value: <bdi dir="auto">{selected.title}</bdi> },
          { label: overview.code, value: selected.code },
          { label: overview.authority, value: selected.issuing_authority ?? overview.authorityNotRecorded },
          { label: overview.status, value: humaniseEnum(selected.operational_status, locale) },
          { label: overview.version, value: selected.version_label },
          {
            label: overview.effectiveFrom,
            value: selected.release_date ? formatDate(selected.release_date, locale) : messages.panels.notRecorded,
          },
          { label: overview.clauses, value: view.clauseCount ?? unavailable },
        ]} />
      </section>
      <section className={styles.group} aria-label={overview.summary}>
        <h3 className={styles.groupHeading}>{overview.summary}</h3>
        <div className={styles.metricChips}>
          <span className={styles.metricChip}>{overview.metricItems} <b>{view.itemCount ?? unavailable}</b></span>
          <span className={styles.metricChip}>
            {overview.metricViolations} <b>{view.violationsUnavailable ? unavailable : view.violationCodes.length}</b>
          </span>
          <span className={styles.metricChip}>
            {overview.metricPenalties} <b>{view.penaltiesUnavailable ? unavailable : view.penalties.length}</b>
          </span>
        </div>
      </section>
      <section className={styles.group} aria-label={overview.configuration}>
        <h3 className={styles.groupHeading}>{overview.configuration}</h3>
        <DefinitionList columns="two" items={[
          {
            label: overview.createdThroughRequest,
            value: selected.request_id ?? overview.noRequestRecorded,
          },
        ]} />
      </section>
    </div>
  );
}

function Items({ view, messages }: PanelProps) {
  const panels = messages.panels;
  if (view.itemCount === null) return <Unavailable title={panels.itemsUnavailable} body={panels.unavailableBody} />;
  return (
    <DataTable
      rows={view.inspectionItems}
      getRowId={item => item.id}
      bleed={false}
      density="compact"
      empty={{ title: panels.noRecords, description: panels.noRecordsBody }}
      columns={[
        { key: "item", header: panels.itemColumn, isRowHeader: true, cell: item => <bdi dir="auto">{item.title}</bdi> },
        { key: "code", header: panels.codeColumn, cell: item => <span className={styles.code}>{item.code}</span>, width: "min" },
        { key: "clause", header: panels.clauseColumn, cell: item => <CellMuted>{item.clauseRef}</CellMuted>, width: "min" },
      ]}
    />
  );
}

function Violations({ view, messages, locale }: PanelProps) {
  const panels = messages.panels;
  if (view.violationsUnavailable) {
    return <Unavailable title={panels.violationsUnavailable} body={panels.unavailableBody} />;
  }
  return (
    <DataTable
      rows={view.violationCodes}
      getRowId={violation => violation.id}
      bleed={false}
      density="compact"
      empty={{ title: panels.noRecords, description: panels.noRecordsBody }}
      columns={[
        { key: "violation", header: panels.violationColumn, isRowHeader: true, cell: violation => <bdi dir="auto">{violation.title}</bdi> },
        { key: "code", header: panels.codeColumn, cell: violation => <span className={styles.code}>{violation.code}</span>, width: "min" },
        {
          key: "severity",
          header: panels.severityColumn,
          width: "min",
          cell: violation => (
            <StatusPill tone={violationLevelTone(violation.level)} size="sm">
              {humaniseEnum(violation.level, locale)}
            </StatusPill>
          ),
        },
      ]}
    />
  );
}

function Penalties({ view, messages }: PanelProps) {
  const panels = messages.panels;
  if (view.penaltiesUnavailable) {
    return <Unavailable title={panels.penaltiesUnavailable} body={panels.unavailableBody} />;
  }
  return (
    <DataTable
      rows={view.penalties}
      getRowId={penalty => penalty.id}
      bleed={false}
      density="compact"
      empty={{ title: panels.noRecords, description: panels.noRecordsBody }}
      columns={[
        { key: "penalty", header: panels.penaltyColumn, isRowHeader: true, cell: penalty => <bdi dir="auto">{penalty.penalty_ref}</bdi> },
        { key: "mapping", header: panels.mappingColumn, cell: penalty => <CellMuted>{penalty.mapping_version}</CellMuted>, width: "min" },
      ]}
    />
  );
}

function Versions({ view, selected, messages, locale }: PanelProps) {
  const panels = messages.panels;
  if (view.versionsUnavailable) {
    return <Unavailable title={panels.versionsUnavailable} body={panels.unavailableBody} />;
  }
  if (!view.versions.length) return <EmptyState title={panels.noRecords} description={panels.noRecordsBody} size="sm" />;
  const currentId = selected.current_version_id ?? selected.entity_id;
  return (
    <ListRows bleed={false} label={messages.tabs.versions}>
      {view.versions.map(version => (
        <ListRow
          key={version.id}
          title={fill(panels.versionRow, { number: version.version_number })}
          description={version.published_at ? formatDate(version.published_at, locale) : panels.notRecorded}
          trailing={
            <StatusPill tone={version.id === currentId ? "success" : "neutral"} size="sm">
              {version.id === currentId ? panels.versionCurrent : panels.versionSuperseded}
            </StatusPill>
          }
        />
      ))}
    </ListRows>
  );
}

function Audit({ view, messages, locale }: PanelProps) {
  const panels = messages.panels;
  if (view.auditUnavailable) return <Unavailable title={panels.auditUnavailable} body={panels.unavailableBody} />;
  if (!view.auditEvents.length) return <EmptyState title={panels.noRecords} description={panels.noRecordsBody} size="sm" />;
  return (
    <Timeline
      label={panels.auditLabel}
      events={view.auditEvents.map(event => ({
        id: String(event.id),
        title: humaniseEnum(event.action, locale),
        dateTime: event.occurred_at,
        time: formatDateTime(event.occurred_at, locale),
        meta: event.actor ?? undefined,
      }))}
    />
  );
}

const PANELS = {
  overview: Overview,
  items: Items,
  violations: Violations,
  penalties: Penalties,
  versions: Versions,
  audit: Audit,
} as const;

export default function LibraryPanels(props: PanelProps) {
  const Panel = PANELS[props.view.scope.tab];
  return <div className={styles.panel}><Panel {...props} /></div>;
}
