"use client";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import Choice from "@/components/saqeel/choice/choice";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import type { GradedFactory } from "@/features/planning-single/shapes";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import type { PublishTarget } from "@/features/planning-single/target";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { ResolvedPortfolio } from "@/lib/planning/factory-resolver";

type ResolvedLicence = ResolvedPortfolio["licences"][number];

export default function TargetConfirmation({
  target, licence, legacyFactory, licenseNumber, onLicenseConfirm,
  locationConfirmed, onLocationConfirm, strings, locale,
}: {
  target: PublishTarget;
  licence: ResolvedLicence | null;
  legacyFactory: GradedFactory | null;
  licenseNumber: string;
  onLicenseConfirm: (licenseNumber: string) => void;
  locationConfirmed: boolean;
  onLocationConfirm: (confirmed: boolean) => void;
  strings: SingleVisitStrings;
  locale: Locale;
}) {
  const hasOfficial = target.officialLat != null && target.officialLng != null;
  const pin = hasOfficial
    ? <bdi>{target.officialLat}, {target.officialLng}</bdi>
    : strings.noOfficialPin;
  const licenceFreshness = licence?.sourceSyncedAt
    ? formatDate(licence.sourceSyncedAt, locale)
    : strings.freshnessNever;

  return (
    <>
      {target.kind === "canonical" && licence ? (
        <Card as="section" labelledBy="single-visit-profile">
          <CardHeader
            level="h2"
            titleId="single-visit-profile"
            eyebrow={strings.selectedProfile}
            title={target.name}
            description={`${strings.sourceLabel}: ${licence.sourceSystem ?? strings.absent} · ${strings.freshnessLabel}: ${licenceFreshness}`}
            trailing={
              <StatusPill tone="neutral">
                {strings.riskContext}: {target.riskBand ?? strings.riskUnknown}
                {target.riskScore != null ? ` (${target.riskScore})` : ""}
              </StatusPill>
            }
          />
          <CardBody>
            <DefinitionList
              columns="two"
              items={[
                { label: strings.crPrefix, value: <bdi>{target.crNumber ?? strings.absent}</bdi> },
                { label: strings.licenseLabel, value: <bdi>{target.canonicalLicenseNumber ?? strings.absent}</bdi> },
                { label: strings.plantLabel, value: <bdi>{target.plantNumber ?? strings.absent}</bdi> },
                { label: strings.officialAddress, value: target.officialAddress },
                { label: strings.officialPin, value: pin },
              ]}
            />
          </CardBody>
          <CardFooter>
            <Button variant="secondary" size="sm" href={`/factories/${target.factoryId}`} label={strings.factory360}>
              {strings.factory360}
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {target.kind === "legacy" && legacyFactory ? (
        <Card as="section" labelledBy="single-visit-licence">
          <CardHeader
            level="h2"
            titleId="single-visit-licence"
            title={strings.licenseStep}
            description={legacyFactory.license_number ? strings.licenseSelect : undefined}
          />
          <CardBody>
            {legacyFactory.license_number ? (
              <Choice
                kind="radio"
                name="license_number"
                value={legacyFactory.license_number}
                required
                checked={licenseNumber === legacyFactory.license_number}
                onChange={() => onLicenseConfirm(legacyFactory.license_number ?? "")}
                label={<bdi>{legacyFactory.license_number}</bdi>}
                description={`${strings.licenseLabel} · ${legacyFactory.name}`}
              />
            ) : (
              <PlanningNotice tone="info">{strings.licenseNone}</PlanningNotice>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card as="section" labelledBy="single-visit-location">
        <CardHeader
          level="h2"
          titleId="single-visit-location"
          title={strings.locationStep}
          description={`${strings.locationAuthority}: ${target.masterSource ?? strings.absent} · ${strings.locationReadOnly}`}
        />
        <CardBody gap="tight">
          {hasOfficial ? null : <PlanningNotice tone="warning">{strings.noOfficialPin}</PlanningNotice>}
          <DefinitionList
            columns="two"
            items={[
              { label: strings.officialAddress, value: target.officialAddress },
              { label: strings.officialPin, value: pin },
            ]}
          />
          <Choice
            kind="checkbox"
            name="location_confirmed"
            value="1"
            required
            disabled={!hasOfficial}
            checked={locationConfirmed}
            onChange={onLocationConfirm}
            label={strings.locationConfirmed}
          />
        </CardBody>
      </Card>
    </>
  );
}
