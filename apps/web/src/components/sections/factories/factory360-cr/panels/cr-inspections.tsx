import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn, CellLink } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Mono } from "@/components/saqeel/type";
import { latestSubmission, type Factory360Dossier } from "@/lib/factory360/dossier";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";

type ReportRow = Factory360Dossier["reports"][number];
type EnforcementRow = Factory360Dossier["approvedEnforcement"][number];

export default function CrInspections({ dossier, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { reports, approvedEnforcement, reportCompliance, reportsResult, factoryId } = dossier;
  const src = fmt.sourceState(reportsResult.error, reports, Boolean(factoryId));
  const enforcementSrc = fmt.sourceState(reportsResult.error, approvedEnforcement, Boolean(factoryId));
  const reportHref = (id: string) => localeHref(locale, `/reports/inspection/${id}`);

  const reportColumns: DataColumn<ReportRow>[] = [
    { key: "number", header: strings.reports.number, isRowHeader: true, cell: row => <Mono>{fmt.text(row.inspection_no ?? row.id.slice(0, 8))}</Mono> },
    { key: "date", header: strings.visits.date, numeric: true, cell: row => fmt.dt(row.submitted_at ?? row.started_at) },
    { key: "status", header: strings.fields.status, cell: row => <StatusPill tone="info">{fmt.label(row.status)}</StatusPill> },
    { key: "version", header: strings.reports.version, cell: row => { const latest = latestSubmission(row); return latest ? `v${latest.version_number}` : strings.reports.notSubmitted; } },
    { key: "compliance", header: strings.reports.compliance, numeric: true, align: "end", cell: row => { const rate = reportCompliance[row.id]?.rate; return rate === null || rate === undefined ? "—" : `${rate}%`; } },
    { key: "open", header: strings.reports.open, headerHidden: true, align: "end", cell: row => <CellLink href={reportHref(row.id)}>{strings.reports.open}</CellLink> },
  ];

  const violationColumns: DataColumn<EnforcementRow>[] = [
    { key: "violation", header: strings.violations.title, isRowHeader: true, cell: ({ violation }) => <><Mono>{fmt.text(violation.violation_codes?.code)}</Mono>{` · ${fmt.text(violation.violation_codes?.title)}`}</> },
    { key: "severity", header: strings.violations.severity, cell: ({ violation }) => fmt.label(violation.violation_codes?.level) },
    { key: "corrective", header: strings.violations.corrective, cell: ({ violation }) => fmt.text(violation.violation_codes?.corrective_action) },
    { key: "grace", header: strings.violations.grace, numeric: true, cell: ({ violation }) => violation.violation_codes?.grace_period_days === null || violation.violation_codes?.grace_period_days === undefined ? "—" : `${violation.violation_codes.grace_period_days}` },
    { key: "origin", header: strings.violations.origin, cell: ({ report }) => <CellLink href={reportHref(report.id)}>{fmt.text(report.inspection_no ?? report.id.slice(0, 8))}</CellLink> },
  ];

  return (
    <>
      <Card as="section" labelledBy="f360cr-reports">
        <CardHeader level="h2" titleId="f360cr-reports" title={strings.reports.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
        <CardBody>
          <DataTable rows={reports} columns={reportColumns} getRowId={row => row.id} caption={strings.reports.heading} empty={{ icon: "inspect", title: reportsResult.error ? strings.section.degraded : strings.reports.empty }} />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-violations">
        <CardHeader level="h2" titleId="f360cr-violations" title={strings.violations.heading} trailing={<StatusPill tone={enforcementSrc.tone}>{enforcementSrc.label}</StatusPill>} />
        <CardBody>
          <DataTable rows={approvedEnforcement} columns={violationColumns} getRowId={({ violation }) => violation.id} caption={strings.violations.heading} empty={{ icon: "enforcement", title: reportsResult.error ? strings.section.degraded : strings.violations.empty }} />
        </CardBody>
      </Card>
    </>
  );
}
