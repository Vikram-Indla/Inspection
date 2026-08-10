import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import Choice from "@/components/saqeel/choice/choice";
import type { CriteriaFactory } from "@/features/planning-bulk/view";
import styles from "./bulk-evidence-table.module.css";

export type EvidenceTableStrings = {
  colFactory: string; colCr: string; colCity: string; colRisk: string;
  colEligibility: string; colProvenance: string; colDataQuality: string;
  selectFactory: string; eligible: string; duplicate: string;
  dqComplete: string; dqNoLocation: string; dqUnknownRisk: string;
  riskAdvisory: string;
  emptyTitle: string; emptyBody: string;
  riskBands: Record<string, string>;
};

const RISK_TONE: Readonly<Record<string, StatusTone>> = {
  high: "danger",
  medium: "warning",
  low: "success",
};

const MISSING = "—";

export default function BulkEvidenceTable({
  rows, strings, busy, isSelected, isDuplicate, isFocused, provenanceOf, onToggle,
}: {
  rows: readonly CriteriaFactory[];
  busy?: boolean;
  strings: EvidenceTableStrings;
  isSelected: (factory: CriteriaFactory) => boolean;
  isDuplicate: (factory: CriteriaFactory) => boolean;
  isFocused: (factory: CriteriaFactory) => boolean;
  provenanceOf: (factory: CriteriaFactory) => string;
  onToggle: (id: string, checked: boolean) => void;
}) {
  const columns: readonly DataColumn<CriteriaFactory>[] = [
    {
      key: "select",
      header: strings.colFactory,
      headerControl: <span className="sqx-visually-hidden">{strings.colFactory}</span>,
      width: "min",
      cell: factory => (
        <Choice
          kind="checkbox"
          name="bulk-selection"
          value={factory.id}
          label={<span className="sqx-visually-hidden">{strings.selectFactory.replace("{name}", factory.name)}</span>}
          checked={isSelected(factory)}
          disabled={isDuplicate(factory)}
          onChange={checked => onToggle(factory.id, checked)}
        />
      ),
    },
    {
      key: "factory",
      header: strings.colFactory,
      isRowHeader: true,
      cell: factory => (
        <span className={styles.identity}>
          <a className={styles.name} href={`/factories/${factory.id}`}>{factory.name}</a>
          <bdi className={styles.code}>{factory.factory_code ?? MISSING}</bdi>
        </span>
      ),
    },
    { key: "cr", header: strings.colCr, numeric: true, cell: factory => <bdi>{factory.cr_number ?? MISSING}</bdi> },
    { key: "city", header: strings.colCity, cell: factory => factory.city ?? MISSING },
    {
      key: "risk",
      header: strings.colRisk,
      cell: factory => (
        <StatusPill tone={factory.risk_band ? RISK_TONE[factory.risk_band] ?? "neutral" : "neutral"}>
          {factory.risk_band ? strings.riskBands[factory.risk_band] ?? factory.risk_band : MISSING}
          {factory.risk_score === null ? "" : ` · ${factory.risk_score}`}
        </StatusPill>
      ),
    },
    {
      key: "eligibility",
      header: strings.colEligibility,
      cell: factory => isDuplicate(factory)
        ? <StatusPill tone="danger">{strings.duplicate}</StatusPill>
        : <StatusPill tone="success">{strings.eligible}</StatusPill>,
    },
    {
      key: "provenance",
      header: strings.colProvenance,
      cell: factory => <bdi className={styles.code}>{provenanceOf(factory)}</bdi>,
    },
    {
      key: "quality",
      header: strings.colDataQuality,
      cell: factory => {
        const hasLocation = factory.official_lat !== null && factory.official_lng !== null;
        if (hasLocation && factory.risk_band !== null) return <span className={styles.code}>{strings.dqComplete}</span>;
        return (
          <span className={styles.flags}>
            {hasLocation ? null : <StatusPill tone="danger">{strings.dqNoLocation}</StatusPill>}
            {factory.risk_band === null ? <StatusPill tone="warning">{strings.dqUnknownRisk}</StatusPill> : null}
          </span>
        );
      },
    },
  ];

  return (
    <div className={styles.root} aria-busy={busy}>
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={factory => factory.id}
        getRowSelected={factory => isSelected(factory) || isFocused(factory)}
        caption={strings.riskAdvisory}
        empty={{ icon: "factory", title: strings.emptyTitle, description: strings.emptyBody }}
      />
    </div>
  );
}
