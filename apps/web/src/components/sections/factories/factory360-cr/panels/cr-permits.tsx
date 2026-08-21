import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";
import styles from "../factory360-cr.module.css";

type PermitRow = Factory360Dossier["chemicalPermits"][number];
type ExemptionRow = Factory360Dossier["customsExemptions"][number];

export default function CrPermits({ dossier, fmt, strings }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
}) {
  const { chemicalPermits, customsExemptions, chemicalPermitsError, customsExemptionsError, selected } = dossier;
  const hasPlant = Boolean(selected?.plant_number);
  const src = fmt.sourceState(Boolean(chemicalPermitsError || customsExemptionsError), [...chemicalPermits, ...customsExemptions], hasPlant);

  const permitColumns: DataColumn<PermitRow>[] = [
    { key: "approval", header: strings.chemicalPermits.approval, isRowHeader: true, numeric: true, cell: row => <Mono>{fmt.text(row.approvalNumber)}</Mono> },
    { key: "type", header: strings.fields.type, cell: row => fmt.label(row.type?.label) },
    { key: "status", header: strings.fields.status, cell: row => <StatusPill tone="info">{fmt.label(row.status?.label)}</StatusPill> },
    { key: "validity", header: strings.fields.validity, numeric: true, cell: row => <Mono>{`${fmt.dt(row.startsAt)} → ${fmt.dt(row.endsAt)}`}</Mono> },
  ];
  const exemptionColumns: DataColumn<ExemptionRow>[] = [
    { key: "decree", header: strings.customsExemptions.decree, isRowHeader: true, numeric: true, cell: row => <Mono>{fmt.text(row.decreeNumber)}</Mono> },
    { key: "type", header: strings.fields.type, cell: row => fmt.label(row.type?.label) },
    { key: "status", header: strings.fields.status, cell: row => <StatusPill tone="info">{fmt.label(row.status?.label)}</StatusPill> },
    { key: "validity", header: strings.fields.validity, numeric: true, cell: row => <Mono>{`${fmt.dt(row.startsAt)} → ${fmt.dt(row.endsAt)}`}</Mono> },
  ];

  return (
    <Card as="section" labelledBy="f360cr-permits">
      <CardHeader level="h2" titleId="f360cr-permits" title={strings.chemicalCustoms.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
      <CardBody>
        {!hasPlant ? (
          <EmptyState icon="restricted" title={strings.chemicalCustoms.noPlant} size="sm" />
        ) : (
          <div className={styles.subgroup}>
            <Heading level={3}>{strings.chemicalPermits.heading}</Heading>
            {chemicalPermitsError
              ? <Text as="p" tone="muted">{strings.section.degraded}</Text>
              : <DataTable rows={chemicalPermits} columns={permitColumns} getRowId={row => row.externalId} caption={strings.chemicalPermits.heading} empty={{ icon: "library", title: strings.chemicalPermits.empty }} />}
            <Heading level={3}>{strings.customsExemptions.heading}</Heading>
            {customsExemptionsError
              ? <Text as="p" tone="muted">{strings.section.degraded}</Text>
              : <DataTable rows={customsExemptions} columns={exemptionColumns} getRowId={row => row.externalId} caption={strings.customsExemptions.heading} empty={{ icon: "library", title: strings.customsExemptions.empty }} />}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
