import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList, { type Definition } from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";

export default function CrRegistry({ dossier, fmt, strings }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
}) {
  const { cr, crError, portfolioCounts, highestRiskLicense, portfolioReportsResult } = dossier;
  if (!cr) return null;
  const src = fmt.sourceState(crError, cr);

  const identity: Definition[] = [
    { label: strings.cr.number, value: <Mono>{cr.cr_number}</Mono> },
    { label: strings.cr.unified, value: <Mono>{fmt.text(cr.unified_number)}</Mono> },
    { label: strings.cr.legalEn, value: <Text as="span" dir="ltr">{fmt.text(cr.legal_name_en ?? cr.legal_name)}</Text> },
    { label: strings.cr.legalAr, value: <Text as="span" dir="rtl">{fmt.text(cr.legal_name_ar)}</Text> },
    { label: strings.fields.status, value: fmt.label(cr.status) },
    { label: strings.cr.dates, value: <Mono>{`${fmt.dt(cr.issue_date)} → ${fmt.dt(cr.expiry_date)}`}</Mono> },
    { label: strings.cr.owner, value: fmt.text(cr.owner_details) },
  ];

  const portfolio: Definition[] = [
    { label: strings.cr.totalLicenses, value: <Mono>{String(portfolioCounts.total)}</Mono> },
    { label: strings.cr.licenseStates, value: <Mono>{`${portfolioCounts.active} / ${portfolioCounts.expired} / ${portfolioCounts.suspended}`}</Mono> },
    {
      label: strings.cr.highestRisk,
      value: highestRiskLicense
        ? <><Mono>{highestRiskLicense.license_number}</Mono>{` · ${fmt.text(highestRiskLicense.factories?.risk_score)} · ${fmt.label(highestRiskLicense.factories?.risk_band)}`}</>
        : strings.compliance.notAvailable,
    },
    { label: strings.cr.approvedInspections, value: portfolioReportsResult.error ? strings.source.degraded : <Mono>{String(portfolioCounts.approvedInspections)}</Mono> },
    { label: strings.cr.openViolations, value: strings.cr.openViolationsUnavailable },
    { label: strings.cr.activePenalties, value: strings.cr.activePenaltiesUnavailable },
  ];

  return (
    <Card as="section" labelledBy="f360cr-cr">
      <CardHeader level="h2" titleId="f360cr-cr" title={strings.cr.heading} trailing={<StatusPill tone={src.tone}>{src.label}</StatusPill>} />
      <CardBody>
        <DefinitionList items={identity} columns="two" />
        <Heading level={3}>{strings.cr.portfolio}</Heading>
        <DefinitionList items={portfolio} columns="two" />
        <Text as="p" tone="muted">{strings.cr.noAggregate}</Text>
      </CardBody>
    </Card>
  );
}
