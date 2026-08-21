import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { Locale } from "@/lib/i18n";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";

type LineRow = Factory360Dossier["lines"][number];
type GovernmentRow = Factory360Dossier["government"][number];

export default function CrIndustrial({ dossier, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { lines, government, linesResult, governmentResult, licenseId } = dossier;
  const linesSrc = fmt.sourceState(linesResult.error, lines, Boolean(licenseId));
  const govSrc = fmt.sourceState(governmentResult.error, government, Boolean(licenseId));
  const lineName = (row: LineRow) => (locale === "ar" ? row.name_ar ?? row.name_en : row.name_en ?? row.name_ar) ?? "—";

  const lineColumns: DataColumn<LineRow>[] = [
    { key: "type", header: strings.fields.type, isRowHeader: true, cell: row => fmt.label(row.item_type) },
    { key: "name", header: strings.fields.name, cell: row => lineName(row) },
    { key: "hs", header: strings.industrial.hsCode, numeric: true, cell: row => <Mono>{`${fmt.text(row.hs_code ?? row.activity_code)}${row.hs_code_type ? ` · ${row.hs_code_type}` : ""}`}</Mono> },
    { key: "quantity", header: strings.industrial.quantity, numeric: true, cell: row => <Mono>{`${fmt.text(row.quantity)} / ${fmt.text(row.capacity)} ${fmt.text(row.unit_code)}`}</Mono> },
    { key: "production", header: strings.industrial.production, numeric: true, cell: row => <Mono>{`${fmt.text(row.real_production)} / ${fmt.text(row.maximum_production)}`}</Mono> },
    { key: "source", header: strings.fields.sourceSystem, cell: row => `${fmt.text(row.source_system)} · v${row.version_number}` },
  ];

  const govColumns: DataColumn<GovernmentRow>[] = [
    { key: "type", header: strings.fields.type, isRowHeader: true, cell: row => fmt.text(row.title ?? row.record_type) },
    { key: "reference", header: strings.fields.reference, numeric: true, cell: row => <Mono>{row.external_record_id}</Mono> },
    { key: "status", header: strings.fields.status, cell: row => fmt.label(row.status) },
    { key: "validity", header: strings.fields.validity, numeric: true, cell: row => <Mono>{`${fmt.dt(row.valid_from)} → ${fmt.dt(row.valid_to)}`}</Mono> },
    { key: "source", header: strings.fields.sourceSystem, cell: row => `${fmt.text(row.source_system)} · v${row.version_number}` },
  ];

  return (
    <>
      <Card as="section" labelledBy="f360cr-industrial">
        <CardHeader level="h2" titleId="f360cr-industrial" title={strings.industrial.heading} trailing={<StatusPill tone={linesSrc.tone}>{linesSrc.label}</StatusPill>} />
        <CardBody>
          <DataTable rows={lines} columns={lineColumns} getRowId={row => row.id} caption={strings.industrial.heading} empty={{ icon: "factory", title: linesResult.error ? strings.section.degraded : strings.industrial.empty }} />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-government">
        <CardHeader level="h2" titleId="f360cr-government" title={strings.government.heading} trailing={<StatusPill tone={govSrc.tone}>{govSrc.label}</StatusPill>} />
        <CardBody>
          <DataTable rows={government} columns={govColumns} getRowId={row => row.id} caption={strings.government.heading} empty={{ icon: "library", title: governmentResult.error ? strings.section.degraded : strings.government.empty }} />
        </CardBody>
      </Card>
    </>
  );
}
