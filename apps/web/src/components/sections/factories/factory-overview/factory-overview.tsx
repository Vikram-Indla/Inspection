import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
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
  readonly plantNumber: string;
  readonly licenceType: string;
  readonly stage: string;
  readonly licenceState: string;
  readonly createInspection: string;
  readonly viewOnMap: string;
  readonly openProfile: string;
  readonly missing: string;
  readonly sectionAvailable: string;
};

export default function FactoryOverview({
  factory,
  sections,
  snapshot,
  createHref,
  mapHref,
  profileHref,
  strings,
}: {
  factory: FactoryRow;
  sections: readonly FactoryOverviewSection[];
  snapshot: ReactNode;
  createHref: string | null;
  mapHref: string;
  profileHref: string;
  strings: FactoryOverviewStrings;
}) {
  const location = [factory.region, factory.city].filter(Boolean).join(" · ");
  const heroFacts = [
    { label: strings.plantNumber, value: <bdi>{factory.license?.plant_number ?? strings.missing}</bdi> },
    { label: strings.licenceType, value: titleCase(factory.license?.license_type ?? factory.activity_class) },
    { label: strings.stage, value: titleCase(factory.license?.stage ?? null) },
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

      {snapshot}

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
