import { type ReactNode } from "react";
import { Card, CardBody, CardGrid, CardHeader } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatCard from "@/components/saqeel/stat-card/stat-card";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import styles from "./factories-portfolio.module.css";

export type PortfolioLicence = {
  readonly id: string;
  readonly name: string;
  readonly licenceNumber: string | null;
  readonly plantNumber: string | null;
  readonly type: string | null;
  readonly stage: string | null;
  readonly licenceStatus: string | null;
  readonly riskBand: string | null;
  readonly provenanceLabel: string;
  readonly provenanceTone: StatusTone;
};

export type PortfolioStrings = {
  readonly allLicences: string;
  readonly factories: string;
  readonly highRisk: string;
  readonly licenceNumber: string;
  readonly plantNumber: string;
  readonly type: string;
  readonly stage: string;
  readonly licenceStatus: string;
  readonly risk: string;
  readonly compliance: string;
  readonly openViolations: string;
  readonly notAvailable: string;
  readonly missing: string;
  readonly riskHigh: string;
  readonly riskMedium: string;
  readonly riskLow: string;
};

type Fact = {
  readonly term: string;
  readonly value: ReactNode;
};

function riskTone(band: string | null): StatusTone {
  if (band === "high") return "danger";
  if (band === "medium") return "warning";
  if (band === "low") return "success";
  return "neutral";
}

function riskLabel(band: string | null, strings: PortfolioStrings): string | null {
  if (band === "high") return strings.riskHigh;
  if (band === "medium") return strings.riskMedium;
  if (band === "low") return strings.riskLow;
  return band;
}

function riskValue(band: string | null, strings: PortfolioStrings): ReactNode {
  const label = riskLabel(band, strings);
  if (!label) return strings.missing;
  return <StatusPill tone={riskTone(band)}>{label}</StatusPill>;
}

function factsOf(licence: PortfolioLicence, strings: PortfolioStrings): readonly Fact[] {
  return [
    { term: strings.licenceNumber, value: licence.licenceNumber ?? strings.missing },
    { term: strings.plantNumber, value: licence.plantNumber ?? strings.missing },
    { term: strings.type, value: licence.type ?? strings.missing },
    { term: strings.stage, value: licence.stage ?? strings.missing },
    { term: strings.licenceStatus, value: licence.licenceStatus ?? strings.missing },
    { term: strings.risk, value: riskValue(licence.riskBand, strings) },
    { term: strings.compliance, value: strings.notAvailable },
    { term: strings.openViolations, value: strings.notAvailable },
  ];
}

export default function FactoriesPortfolio({
  portfolioLabel,
  licences,
  selectedId,
  onSelect,
  highRiskCount,
  strings,
}: {
  portfolioLabel: string;
  licences: readonly PortfolioLicence[];
  selectedId: string;
  onSelect: (id: string) => void;
  highRiskCount: number;
  strings: PortfolioStrings;
}) {
  return (
    <>
      <Card as="section" labelledBy="factories-portfolio-summary">
        <CardHeader
          level="h2"
          titleId="factories-portfolio-summary"
          eyebrow={strings.allLicences}
          title={<span dir="auto">{portfolioLabel}</span>}
        />
        <CardBody>
          <CardGrid min="sm">
            <StatCard label={strings.factories} value={licences.length} />
            <StatCard label={strings.highRisk} value={highRiskCount} />
          </CardGrid>
        </CardBody>
      </Card>

      {licences.map(licence => (
        <Card as="article" key={licence.id}>
          <CardBody gap="tight">
            <h3 className={styles.heading}>
              <button
                className={styles.select}
                type="button"
                aria-pressed={licence.id === selectedId}
                onClick={() => onSelect(licence.id)}
              >
                <span className={styles.check} aria-hidden="true">
                  {licence.id === selectedId ? <Icon name="selected" size="md" /> : null}
                </span>
                <span className={styles.name} dir="auto">{licence.name}</span>
              </button>
            </h3>

            <dl className={styles.facts}>
              {factsOf(licence, strings).map(fact => (
                <div className={styles.fact} key={fact.term}>
                  <dt className={styles.term}>{fact.term}</dt>
                  <dd className={styles.value} dir="auto">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <StatusPill tone={licence.provenanceTone}>
              {licence.provenanceLabel}
            </StatusPill>
          </CardBody>
        </Card>
      ))}
    </>
  );
}
