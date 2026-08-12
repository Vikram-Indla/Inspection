import Button from "@/components/saqeel/button/button";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import styles from "./review-targets.module.css";

export type TargetEvidenceTone = "ok" | "pending" | "blocked";

export type TargetRow = {
  id: string;
  name: string;
  factoryCode: string;
  crNumber: string;
  city: string | null;
  riskBand: string | null;
  riskLabel: string;
  excluded: boolean;
  reasons: readonly string[];
  pick: string;
  evidence: { tone: TargetEvidenceTone; text: string };
};

export type TargetsStrings = {
  targetsH: string; selectedLabel: string; retainedLabel: string;
  colFactory: string; colCity: string; colRisk: string; colVisit: string; colAssign: string;
  typePeriodic: string; excludedLozenge: string; chooseInspector: string;
  autoLabel: string; evReview: string;
  emptyTitle: string; emptyBody: string;
};

const RISK_TONE: Readonly<Record<string, StatusTone>> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

const EVIDENCE_TONE: Readonly<Record<TargetEvidenceTone, StatusTone>> = {
  ok: "success",
  pending: "neutral",
  blocked: "danger",
};

const MISSING = "—";

export default function ReviewTargets({
  rows, inspectors, selectedCount, retainedCount, strings, onPick, onFocusRow,
}: {
  rows: readonly TargetRow[];
  inspectors: readonly SelectOption[];
  selectedCount: number;
  retainedCount: number;
  strings: TargetsStrings;
  onPick: (factoryId: string, inspectorId: string) => void;
  onFocusRow: (factoryId: string) => void;
}) {
  const columns: readonly DataColumn<TargetRow>[] = [
    {
      key: "factory",
      header: strings.colFactory,
      isRowHeader: true,
      cell: row => (
        <span className={styles.identity}>
          <Text as="span" role="bodyStrong">{row.name}</Text>
          <Text as="span" tone="muted" numeric>
            <bdi>{row.factoryCode}</bdi>{` · CR `}<bdi>{row.crNumber}</bdi>
          </Text>
          {row.reasons.length === 0 ? null : (
            <span className={styles.reasons}>
              {row.reasons.map(reason => <StatusPill key={reason} tone="warning">{reason}</StatusPill>)}
            </span>
          )}
        </span>
      ),
    },
    { key: "city", header: strings.colCity, cell: row => row.city ?? MISSING },
    {
      key: "risk",
      header: strings.colRisk,
      cell: row => (
        <StatusPill tone={row.riskBand ? RISK_TONE[row.riskBand] ?? "neutral" : "neutral"}>{row.riskLabel}</StatusPill>
      ),
    },
    {
      key: "visit",
      header: strings.colVisit,
      cell: row => row.excluded
        ? <Text as="span" tone="muted" numeric>{MISSING}</Text>
        : <StatusPill tone="info">{strings.typePeriodic}</StatusPill>,
    },
    {
      key: "assignment",
      header: strings.colAssign,
      cell: row => row.excluded
        ? <StatusPill tone="danger">{strings.excludedLozenge}</StatusPill>
        : (
          <span className={styles.assignment}>
            <SaqeelSelect
              options={[{ value: "", label: strings.autoLabel }, ...inspectors]}
              value={row.pick}
              label={strings.chooseInspector}
              onChange={value => onPick(row.id, value)}
            />
            <StatusPill tone={EVIDENCE_TONE[row.evidence.tone]}>{row.evidence.text}</StatusPill>
            <Button variant="link" onClick={() => onFocusRow(row.id)}>{strings.evReview}</Button>
          </span>
        ),
    },
  ];

  return (
    <Card as="section">
      <CardHeader
        title={strings.targetsH}
        description={`${selectedCount} ${strings.selectedLabel} · ${retainedCount} ${strings.retainedLabel}`}
      />
      <CardBody gap="tight">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          getRowSelected={row => row.excluded}
          empty={{ icon: "factory", title: strings.emptyTitle, description: strings.emptyBody }}
        />
      </CardBody>
    </Card>
  );
}
