import { type ReactNode } from "react";
import { Card, CardBody } from "@/components/saqeel/card/card";
import Icon from "@/components/saqeel/icon/icon";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import type { LicenceExpiryState } from "@/features/factories/portfolio";
import styles from "./factories-portfolio.module.css";
import { Heading, Metric, Text } from "@/components/saqeel/type";

export type PortfolioLicence = {
  readonly id: string;
  readonly name: string;
  readonly licenceNumber: string | null;
  readonly plantNumber: string | null;
  readonly type: string | null;
  readonly stage: string | null;
  readonly licenceStatus: string | null;
  readonly riskBand: string | null;
  readonly expiryDate: string | null;
  readonly expiryState: LicenceExpiryState | null;
  readonly openViolations: number | null;
  readonly provenanceLabel: string;
  readonly provenanceTone: StatusTone;
};

export type PortfolioStat = {
  readonly key: string;
  readonly label: string;
  readonly value: number | null;
  readonly tone: StatusTone;
};

export type PortfolioStrings = {
  readonly portfolio: string;
  readonly factories: string;
  readonly highRisk: string;
  readonly openViolations: string;
  readonly activePenalties: string;
  readonly licenceNumber: string;
  readonly plantNumber: string;
  readonly type: string;
  readonly stage: string;
  readonly expiry: string;
  readonly notAvailable: string;
  readonly missing: string;
  readonly riskHigh: string;
  readonly riskMedium: string;
  readonly riskLow: string;
  readonly expired: string;
  readonly expiringSoon: string;
};

type Fact = {
  readonly term: string;
  readonly value: ReactNode;
};

const EXPIRY_TONE: Record<LicenceExpiryState, StatusTone> = {
  expired: "danger",
  expiringSoon: "warning",
  valid: "success",
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

function factsOf(licence: PortfolioLicence, strings: PortfolioStrings, formatDate: (iso: string) => string): readonly Fact[] {
  return [
    { term: strings.licenceNumber, value: licence.licenceNumber ?? strings.missing },
    { term: strings.plantNumber, value: licence.plantNumber ?? strings.missing },
    { term: strings.type, value: licence.type ?? strings.missing },
    { term: strings.stage, value: licence.stage ?? strings.missing },
    { term: strings.expiry, value: licence.expiryDate ? formatDate(licence.expiryDate) : strings.missing },
    { term: strings.openViolations, value: licence.openViolations ?? strings.notAvailable },
  ];
}

export default function FactoriesPortfolio({
  portfolioLabel,
  licences,
  selectedId,
  onSelect,
  stats,
  provenanceNotice,
  formatDate,
  strings,
}: {
  portfolioLabel: string;
  licences: readonly PortfolioLicence[];
  selectedId: string;
  onSelect: (id: string) => void;
  stats: readonly PortfolioStat[];
  provenanceNotice: { readonly label: string; readonly tone: StatusTone } | null;
  formatDate: (iso: string) => string;
  strings: PortfolioStrings;
}) {
  return (
    <>
      <Card as="section" labelledBy="factories-portfolio-summary">
        <CardBody gap="tight">
          <Heading level={2} visual="label" tone="muted" id="factories-portfolio-summary">
            {strings.portfolio} — <span dir="auto">{portfolioLabel}</span>
          </Heading>
          <dl className={styles.summaryGrid}>
            {stats.map(stat => (
              <div className={styles.stat} key={stat.key}>
                <Text as="dt" role="label" tone="muted">{stat.label}</Text>
                <dd className={styles.statValue} data-tone={stat.tone}>
                  <Metric tone="inherit">{stat.value ?? strings.notAvailable}</Metric>
                </dd>
              </div>
            ))}
          </dl>
          {provenanceNotice
            ? <StatusPill tone={provenanceNotice.tone}>{provenanceNotice.label}</StatusPill>
            : null}
        </CardBody>
      </Card>

      {licences.map(licence => (
        <Card as="article" key={licence.id}>
          <CardBody gap="tight">
            <Heading level={3} visual="bodyStrong">
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
            </Heading>

            <dl className={styles.facts}>
              {factsOf(licence, strings, formatDate).map(fact => (
                <div className={styles.fact} key={fact.term}>
                  <Text as="dt" role="label" tone="muted">{fact.term}</Text>
                  <Text as="dd" role="bodyStrong" align="end" numeric dir="auto">{fact.value}</Text>
                </div>
              ))}
            </dl>

            <div className={styles.pills}>
              {licence.licenceStatus
                ? <StatusPill tone="info">{licence.licenceStatus}</StatusPill>
                : null}
              {licence.expiryState && licence.expiryState !== "valid"
                ? (
                  <StatusPill tone={EXPIRY_TONE[licence.expiryState]}>
                    {licence.expiryState === "expired" ? strings.expired : strings.expiringSoon}
                  </StatusPill>
                )
                : null}
              {riskLabel(licence.riskBand, strings)
                ? <StatusPill tone={riskTone(licence.riskBand)}>{riskLabel(licence.riskBand, strings)}</StatusPill>
                : null}
            </div>
          </CardBody>
        </Card>
      ))}
    </>
  );
}
