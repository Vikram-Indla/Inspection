import BarSeries, { type BarPoint } from "@/components/saqeel/charts/bar-series/bar-series";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Metric, Mono, Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { Locale } from "@/lib/i18n";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";
import styles from "../factory360-cr.module.css";

type ObservedDisplay = { readonly key: string; readonly field: string; readonly official: string; readonly observed: string; readonly matches: boolean };

export default function CrCompliance({ dossier, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { currentCompliance, approvedTrend, reportsResult, factoryId, latestApprovedFactorySnapshot, observedComparison, snapshotsResult, licenseId } = dossier;
  const src = fmt.sourceState(reportsResult.error, dossier.reports, Boolean(factoryId));
  const observedSrc = fmt.sourceState(snapshotsResult.error, latestApprovedFactorySnapshot, Boolean(factoryId && licenseId));

  const rate = currentCompliance.rate;
  const caption = currentCompliance.status === "available"
    ? `${currentCompliance.passed}/${currentCompliance.answered}`
    : strings.compliance.na;

  const points: BarPoint[] = [...approvedTrend].reverse().map(({ report, compliance }) => ({
    key: report.id,
    label: fmt.text(report.inspection_no ?? report.id.slice(0, 8)),
    value: compliance.rate ?? 0,
    display: `${compliance.rate ?? 0}%`,
  }));

  const snapshotValue = (key: string) => {
    const value = latestApprovedFactorySnapshot?.snapshot?.[key];
    return value === null || value === undefined || value === "" || typeof value === "object" ? "—" : String(value);
  };
  const fields = strings.observed.fields as Record<string, string>;
  const observedRows: ObservedDisplay[] = latestApprovedFactorySnapshot
    ? observedComparison.map(row => {
      const official = fmt.text(row.official);
      const observed = snapshotValue(row.observedKey);
      return { key: row.key, field: fields[row.key] ?? row.key, official, observed, matches: official === observed };
    })
    : [];

  const observedColumns: DataColumn<ObservedDisplay>[] = [
    { key: "field", header: strings.observed.field, isRowHeader: true, cell: row => row.field },
    { key: "official", header: strings.observed.official, cell: row => <Mono>{row.official}</Mono> },
    { key: "observed", header: strings.observed.captured, cell: row => <Mono>{row.observed}</Mono> },
    { key: "result", header: strings.observed.result, align: "end", cell: row => <StatusPill tone={row.matches ? "success" : "warning"}>{row.matches ? strings.observed.same : strings.observed.changed}</StatusPill> },
  ];

  return (
    <>
      <Card as="section" labelledBy="f360cr-compliance">
        <CardHeader level="h2" titleId="f360cr-compliance" title={strings.compliance.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
        <CardBody>
          <Text as="p" tone="muted">{strings.compliance.rule}</Text>
          <div className={styles.complianceHead}>
            <Metric>{rate === null ? strings.compliance.notAvailable : `${rate}%`}</Metric>
            <Text as="span" tone="muted">{caption}</Text>
          </div>
          {points.length > 1 ? (
            <div className={styles.compliance}>
              <Text as="p" role="label" tone="muted">{strings.compliance.trend}</Text>
              <BarSeries points={points} domainMax={100} track series={2} rtl={locale === "ar"} ariaLabel={strings.compliance.trend} />
              <Text as="p" tone="muted">{strings.compliance.trendCaption}</Text>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card as="section" labelledBy="f360cr-observed">
        <CardHeader level="h2" titleId="f360cr-observed" title={strings.observed.heading} trailing={<StatusPill tone={observedSrc.tone}>{observedSrc.label}</StatusPill>} />
        <CardBody>
          <Text as="p" tone="muted">{strings.observed.rule}</Text>
          <DataTable
            rows={observedRows}
            columns={observedColumns}
            getRowId={row => row.key}
            caption={strings.observed.heading}
            empty={{ icon: "inspect", title: snapshotsResult.error ? strings.section.degraded : strings.observed.empty }}
          />
        </CardBody>
      </Card>
    </>
  );
}
