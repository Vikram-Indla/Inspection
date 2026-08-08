import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { titleCase, type FactoryRow } from "@/features/factories/portfolio";
import styles from "./factory-overview.module.css";

export type FactoryOverviewSection = {
  readonly key: string;
  readonly title: string;
  readonly body: string;
  readonly openLabel: string;
  readonly href: string;
};

export type FactoryOverviewStrings = {
  readonly opened: string;
  readonly plannerNote: string;
  readonly industrialLicence: string;
  readonly plantNumber: string;
  readonly activity: string;
  readonly sourceRecord: string;
  readonly createInspection: string;
  readonly viewOnMap: string;
  readonly openProfile: string;
  readonly conditionTitle: string;
  readonly conditionBasis: string;
  readonly savedRisk: string;
  readonly riskBand: string;
  readonly approvedCompliance: string;
  readonly openViolations: string;
  readonly notAvailable: string;
  readonly missing: string;
  readonly snapshotTitle: string;
  readonly factoryCode: string;
  readonly commercialRegistration: string;
  readonly region: string;
  readonly city: string;
  readonly licenceState: string;
  readonly sectionAvailable: string;
};

export default function FactoryOverview({
  factory,
  condition,
  provenance,
  sections,
  createHref,
  mapHref,
  profileHref,
  strings,
}: {
  factory: FactoryRow;
  condition: { readonly label: string; readonly tone: StatusTone };
  provenance: { readonly label: string; readonly tone: StatusTone; readonly body: string; readonly recorded: string };
  sections: readonly FactoryOverviewSection[];
  createHref: string | null;
  mapHref: string;
  profileHref: string;
  strings: FactoryOverviewStrings;
}) {
  const location = [factory.region, factory.city].filter(Boolean).join(" · ");
  const heroFacts = [
    { label: strings.industrialLicence, value: <bdi>{factory.license?.license_number ?? strings.missing}</bdi> },
    { label: strings.plantNumber, value: <bdi>{factory.license?.plant_number ?? strings.missing}</bdi> },
    { label: strings.activity, value: factory.activity_class ?? strings.missing },
    { label: strings.sourceRecord, value: `${provenance.label} · ${provenance.recorded}` },
  ];
  const conditionFacts = [
    { label: strings.savedRisk, value: factory.risk_score ?? strings.missing },
    { label: strings.riskBand, value: titleCase(factory.risk_band) },
    { label: strings.approvedCompliance, value: strings.notAvailable },
    { label: strings.openViolations, value: strings.notAvailable },
  ];
  const snapshotFacts = [
    { label: strings.factoryCode, value: <bdi>{factory.factory_code || strings.missing}</bdi> },
    { label: strings.commercialRegistration, value: <bdi>{factory.cr_number || strings.missing}</bdi> },
    { label: strings.region, value: factory.region ?? strings.missing },
    { label: strings.city, value: factory.city ?? strings.missing },
    { label: strings.activity, value: factory.activity_class ?? strings.missing },
    { label: strings.licenceState, value: titleCase(factory.license?.status ?? null) },
  ];
  return (
    <>
      <Card as="section" labelledBy="factory-hero-title">
        <CardHeader
          level="h2"
          titleId="factory-hero-title"
          eyebrow={strings.opened}
          title={<span dir="auto">{factory.name}</span>}
          description={
            <span dir="auto">
              <bdi>{factory.factory_code || strings.missing}</bdi>
              {factory.cr_number ? <> · CR <bdi>{factory.cr_number}</bdi></> : null}
              {location ? ` · ${location}` : null}
            </span>
          }
        />
        <CardBody gap="tight">
          <div className={styles.actions}>
            {createHref ? (
              <Button variant="primary" size="sm" href={createHref} label={strings.createInspection}>{strings.createInspection}</Button>
            ) : null}
            <Button variant="secondary" size="sm" href={mapHref} label={strings.viewOnMap}>{strings.viewOnMap}</Button>
            <Button variant="secondary" size="sm" href={profileHref} label={strings.openProfile}>{strings.openProfile}</Button>
          </div>
          {createHref ? <p className={styles.note}>{strings.plannerNote}</p> : null}
          <DefinitionList items={heroFacts} columns="two" />
        </CardBody>
      </Card>

      <Card as="div">
        <CardBody gap="tight">
          <StatusPill tone={provenance.tone}>{provenance.label}</StatusPill>
          <p className={styles.body} dir="auto">{provenance.body}</p>
          <p className={styles.recorded} dir="auto">{provenance.recorded}</p>
        </CardBody>
      </Card>

      <Card as="section" labelledBy="factory-condition-title">
        <CardHeader
          level="h2"
          titleId="factory-condition-title"
          title={strings.conditionTitle}
          trailing={<StatusPill tone={condition.tone}>{condition.label}</StatusPill>}
        />
        <CardBody gap="tight">
          <p className={styles.note}>{strings.conditionBasis}</p>
          <DefinitionList items={conditionFacts} columns="two" />
        </CardBody>
      </Card>

      <Card as="section" labelledBy="factory-snapshot-title">
        <CardHeader level="h2" titleId="factory-snapshot-title" title={strings.snapshotTitle} />
        <CardBody>
          <DefinitionList items={snapshotFacts} columns="two" />
        </CardBody>
      </Card>

      <div className={styles.sections}>
        {sections.map(section => (
          <details className={styles.section} key={section.key}>
            <summary className={styles.summary}>
              <span className={styles.summaryText}>
                <strong className={styles.sectionTitle}>{section.title}</strong>
                <small className={styles.sectionBody}>{section.body}</small>
              </span>
              <span className={styles.marker} aria-hidden="true" />
            </summary>
            <div className={styles.sectionContent}>
              <p className={styles.note}>{strings.sectionAvailable}</p>
              <Button variant="secondary" size="sm" href={section.href} label={section.openLabel}>{section.openLabel}</Button>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
