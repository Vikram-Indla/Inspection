"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { titleCase } from "@/features/factories/portfolio";
import { formatDate } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { GradedFactory, WizardStrings } from "./Wizard";
import styles from "./single-planning.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const RIYADH_CENTRE: readonly [number, number] = [24.7136, 46.6753];
const OFFICIAL_ZOOM = 14;
const REGION_ZOOM = 6;

type DossierView = "text" | "map";

/**
 * The identity dossier shown under a selected candidate.
 *
 * Nothing here mutates the registry — coordinates stay external-master data
 * (M01-038) — and the risk band is advisory context, never a scheduling gate.
 *
 * The text equivalent is the default view, not a fallback. The map runtime is
 * large, and mounting it during a scheduling transaction competes with the
 * publish action for the main thread; the planner opts into it.
 */
export default function IdentityDossier({
  factory, strings, locale,
}: {
  factory: GradedFactory;
  strings: WizardStrings;
  locale: Locale;
}) {
  const [view, setView] = useState<DossierView>("text");
  const hasOfficial = factory.official_lat != null && factory.official_lng != null;

  const markers: GeoMarkerData[] = hasOfficial
    ? [{
        id: "official",
        lat: factory.official_lat as number,
        lng: factory.official_lng as number,
        label: `${strings.officialPin} — ${factory.name}`,
        tone: (factory.risk_band === "high" ? "high" : factory.risk_band === "medium" ? "medium" : "low") as GeoMarkerData["tone"],
        radiusM: factory.geofence_radius_m ?? undefined,
      }]
    : [];

  const centre: [number, number] = hasOfficial
    ? [factory.official_lat as number, factory.official_lng as number]
    : [...RIYADH_CENTRE] as [number, number];

  const [mapLabel, textLabel] = strings.mapToggle.split(" / ");
  const views: SegmentedItem<DossierView>[] = [
    { value: "text", label: textLabel ?? strings.textEquivalent },
    { value: "map", label: mapLabel ?? strings.mapToggle },
  ];

  return (
    <Card as="section" labelledBy={`dossier-${factory.id}`}>
      <CardHeader
        level="h3"
        titleId={`dossier-${factory.id}`}
        title={factory.name}
        description={factory.grade === "exact" ? strings.exactRule : strings.similarRule}
        trailing={
          <span className={styles.choiceLabel}>
            <StatusPill tone={factory.grade === "exact" ? "success" : "warning"}>
              {factory.grade === "exact" ? strings.exactBadge : strings.similarBadge}
            </StatusPill>
            {factory.degraded ? <StatusPill tone="danger">{strings.degradedBadge}</StatusPill> : null}
          </span>
        }
      />
      <CardBody gap="tight">
        <DefinitionList
          columns="two"
          items={[
            { label: strings.crPrefix, value: <bdi>{factory.cr_number ?? "—"}</bdi> },
            { label: strings.licenseLabel, value: <bdi>{factory.license_number ?? strings.licenseNone}</bdi> },
            { label: strings.factory360, value: <bdi>{factory.factory_code ?? "—"}</bdi> },
            {
              label: strings.locationAuthority,
              value: <bdi>{factory.master_source ?? "—"}</bdi>,
            },
            {
              label: strings.freshnessLabel,
              value: factory.source_synced_at
                ? <bdi>{formatDate(factory.source_synced_at, locale)}</bdi>
                : strings.freshnessNever,
            },
            {
              label: strings.riskContext,
              value: `${factory.risk_band ? titleCase(factory.risk_band) : strings.riskUnknown}${factory.risk_score != null ? ` (${factory.risk_score})` : ""}`,
            },
          ]}
        />

        {factory.duplicate ? (
          <PlanningNotice tone="warning">
            {strings.duplicateWarning}
            {factory.duplicateVisitStatus ? <> · {strings.duplicateStatusLabel}: <bdi>{titleCase(factory.duplicateVisitStatus)}</bdi></> : null}
          </PlanningNotice>
        ) : null}

        <SegmentedControl items={views} value={view} label={strings.mapToggle} onChange={setView} />

        {view === "map" ? (
          <div className={styles.mapFrame}>
            <GeoMap center={centre} zoom={hasOfficial ? OFFICIAL_ZOOM : REGION_ZOOM} markers={markers} height="100%" />
          </div>
        ) : (
          <p className={styles.hint}>
            {strings.officialPin}:{" "}
            {hasOfficial ? <bdi>{factory.official_lat}, {factory.official_lng}</bdi> : strings.noOfficialPin}
          </p>
        )}
      </CardBody>
      <CardFooter>
        <Button variant="secondary" size="sm" href={`/factories/${factory.id}`} label={strings.factory360}>
          {strings.factory360}
        </Button>
        {factory.duplicate && factory.duplicateVisitId ? (
          <Button
            variant="link"
            size="sm"
            href={`/visits/${factory.duplicateVisitId}`}
            label={strings.duplicateOpenVisit}
          >
            {strings.duplicateOpenVisit}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
