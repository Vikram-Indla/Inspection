import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import type { WorkspaceItem } from "@/features/regulations/workspace-source";
import { evidenceRequirement, itemActionForms, itemResponses, itemViolationLinks } from "@/features/regulations/workspace-view";
import { fill } from "@/i18n/messages";
import styles from "./regulation-items.module.css";

export type RegulationItemsStrings = {
  readonly caption: string;
  readonly item: string;
  readonly clause: string;
  readonly responses: string;
  readonly evidence: string;
  readonly raises: string;
  readonly actionForm: string;
  readonly state: string;
  readonly active: string;
  readonly inactive: string;
  readonly noEvidence: string;
  readonly evidenceLine: string;
  readonly evidenceOptional: string;
  readonly none: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
};

export default function RegulationItems({ items, labelFor, strings }: {
  items: readonly WorkspaceItem[];
  labelFor: (value: string) => string;
  strings: RegulationItemsStrings;
}) {
  const absent = <span className={styles.absent}>{strings.none}</span>;

  const columns: readonly DataColumn<WorkspaceItem>[] = [
    {
      key: "item",
      header: strings.item,
      isRowHeader: true,
      cell: item => (
        <span className={styles.identity}>
          <span className={styles.title}>{item.title}</span>
          <bdi className={styles.code}>{item.code}</bdi>
        </span>
      ),
    },
    { key: "clause", header: strings.clause, cell: item => item.clauseRef ? <bdi className={styles.code}>{item.clauseRef}</bdi> : absent },
    {
      key: "responses",
      header: strings.responses,
      cell: item => {
        const responses = itemResponses(item.response_model);
        return responses.length ? responses.map(labelFor).join(" · ") : absent;
      },
    },
    {
      key: "evidence",
      header: strings.evidence,
      cell: item => {
        const rule = evidenceRequirement(item.evidence_rule);
        if (!rule) return <span className={styles.absent}>{strings.noEvidence}</span>;
        const line = fill(strings.evidenceLine, {
          type: labelFor(rule.type),
          on: rule.on ? labelFor(rule.on) : "—",
          min: rule.minimum ?? 1,
        });
        return rule.mandatory ? line : `${line} · ${strings.evidenceOptional}`;
      },
    },
    {
      key: "raises",
      header: strings.raises,
      cell: item => {
        const links = itemViolationLinks(item.response_model);
        return links.length
          ? <span className={styles.codes}>{links.map(link => <bdi className={styles.code} key={link.violationCode}>{link.violationCode}</bdi>)}</span>
          : absent;
      },
    },
    {
      key: "actionForm",
      header: strings.actionForm,
      cell: item => {
        const forms = itemActionForms(item.response_model);
        return forms.length ? forms.map(labelFor).join(" · ") : absent;
      },
    },
    {
      key: "state",
      header: strings.state,
      cell: item => (
        <StatusPill tone={item.active ? "success" : "neutral"}>
          {item.active ? strings.active : strings.inactive}
        </StatusPill>
      ),
    },
  ];

  return (
    <DataTable
      rows={items}
      columns={columns}
      getRowId={item => item.id}
      caption={strings.caption}
      density="compact"
      empty={{ title: strings.emptyTitle, description: strings.emptyBody }}
    />
  );
}
