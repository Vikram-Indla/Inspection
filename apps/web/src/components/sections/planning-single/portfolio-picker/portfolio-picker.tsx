"use client";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Choice from "@/components/saqeel/choice/choice";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { titleCase } from "@/features/factories/portfolio";
import { registryStatusTone } from "@/features/planning-single/registry-status";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { ResolvedPortfolio } from "@/lib/planning/factory-resolver";
import styles from "./portfolio-picker.module.css";

export default function PortfolioPicker({
  portfolios, handoff, selectedLicenceId, onSelect, strings, locale,
}: {
  portfolios: readonly ResolvedPortfolio[];
  handoff: boolean;
  selectedLicenceId: string | null;
  onSelect: (licenceId: string) => void;
  strings: SingleVisitStrings;
  locale: Locale;
}) {
  const freshness = (syncedAt: string | null) =>
    syncedAt ? formatDate(syncedAt, locale) : strings.freshnessNever;

  return (
    <Card as="section" labelledBy="single-visit-portfolio">
      <CardHeader
        level="h2"
        titleId="single-visit-portfolio"
        eyebrow={strings.stepLabels.licence}
        title={strings.portfolioStep}
      />
      <CardBody>
        {handoff ? <PlanningNotice tone="info">{strings.prefilledHandoff}</PlanningNotice> : null}
        {portfolios.map(portfolio => (
          <Card as="article" key={portfolio.id}>
            <CardHeader
              level="h3"
              eyebrow={<>{strings.crIdentity} <bdi>{portfolio.crNumber}</bdi></>}
              title={portfolio.legalNameEn ?? portfolio.legalName ?? portfolio.crNumber}
              description={`${strings.sourceLabel}: ${portfolio.sourceSystem ?? strings.absent} · ${strings.freshnessLabel}: ${freshness(portfolio.sourceSyncedAt)}`}
              trailing={portfolio.status
                ? <StatusPill tone={registryStatusTone(portfolio.status)}>{titleCase(portfolio.status)}</StatusPill>
                : undefined}
            />
            <CardBody gap="tight">
              {portfolio.licences.length === 0 ? (
                <PlanningNotice tone="warning">{strings.noLicences}</PlanningNotice>
              ) : (
                <>
                  <p className={styles.hint}>{strings.selectLicenceHint}</p>
                  <ul className={styles.list} role="listbox" aria-label={strings.portfolioStep}>
                    {portfolio.licences.map(licence => (
                      <li className={styles.item} key={licence.id}>
                        <Choice
                          kind="radio"
                          name="licence_id"
                          value={licence.id}
                          disabled={!licence.factory}
                          checked={selectedLicenceId === licence.id}
                          onChange={() => onSelect(licence.id)}
                          label={
                            <span className={styles.label}>
                              <bdi>{licence.licenseNumber}</bdi>
                              {licence.status
                                ? <StatusPill tone={registryStatusTone(licence.status)}>{titleCase(licence.status)}</StatusPill>
                                : null}
                            </span>
                          }
                          description={
                            <>
                              {strings.plantLabel} <bdi>{licence.plantNumber ?? strings.absent}</bdi>
                              {" · "}{licence.factory ? licence.factory.name : strings.noFactoryLink}
                            </>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                  {selectedLicenceId === null
                    ? <PlanningNotice tone="info">{strings.licenceRequired}</PlanningNotice>
                    : null}
                </>
              )}
            </CardBody>
          </Card>
        ))}
      </CardBody>
    </Card>
  );
}
