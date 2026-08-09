import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import { CardGrid } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { RegulationWorkspace } from "@/features/regulations/workspace-source";
import { configStatusTone } from "@/features/regulations/workspace-view";
import styles from "./regulation-overview.module.css";

export type RegulationOverviewStrings = {
  readonly authority: string;
  readonly legalSource: string;
  readonly status: string;
  readonly version: string;
  readonly effectiveFrom: string;
  readonly published: string;
  readonly clauses: string;
  readonly items: string;
  readonly activeItems: string;
  readonly violations: string;
  readonly penalties: string;
  readonly notRecorded: string;
  readonly unavailable: string;
  readonly absent: string;
};

export default function RegulationOverview({ workspace, statusLabel, formatDay, strings }: {
  workspace: RegulationWorkspace;
  statusLabel: string;
  formatDay: (iso: string) => string;
  strings: RegulationOverviewStrings;
}) {
  const { regulation } = workspace;
  const missing = <span className={styles.absent}>{strings.notRecorded}</span>;
  const count = (table: RegulationWorkspace["items"] | RegulationWorkspace["violations"] | RegulationWorkspace["penalties"]) =>
    table.kind === "unavailable" ? strings.unavailable : String(table.rows.length);

  return (
    <div className={styles.root}>
      <DefinitionList
        columns="two"
        items={[
          { label: strings.authority, value: regulation.issuing_authority ?? missing },
          { label: strings.legalSource, value: workspace.legalSources.length ? workspace.legalSources.join(" · ") : missing },
          { label: strings.status, value: <StatusPill tone={configStatusTone(regulation.operational_status)}>{statusLabel}</StatusPill> },
          { label: strings.version, value: <bdi>{regulation.version_label ?? "—"}</bdi> },
          { label: strings.effectiveFrom, value: regulation.release_date ? <bdi>{formatDay(regulation.release_date)}</bdi> : missing },
          { label: strings.published, value: regulation.published_at ? <bdi>{formatDay(regulation.published_at)}</bdi> : missing },
        ]}
      />

      <CardGrid min="sm">
        <StatCard label={strings.clauses} value={workspace.clauseCount === null ? strings.unavailable : String(workspace.clauseCount)} />
        <StatCard label={strings.items} value={count(workspace.items)} />
        <StatCard
          label={strings.activeItems}
          value={workspace.items.kind === "unavailable"
            ? strings.unavailable
            : String(workspace.items.rows.filter(item => item.active).length)}
        />
        <StatCard label={strings.violations} value={count(workspace.violations)} />
        <StatCard label={strings.penalties} value={count(workspace.penalties)} />
      </CardGrid>

      <p className={styles.note}>{strings.absent}</p>
    </div>
  );
}
