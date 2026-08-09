"use client";

import { useState } from "react";
import FactoriesPortfolio from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import FactoryAiAdvisory from "@/components/sections/factories/factory-ai-advisory/factory-ai-advisory";
import FactoryContext from "@/components/sections/factories/factory-context/factory-context";
import FactoryRiskOutlook from "@/components/sections/factories/factory-risk-outlook/factory-risk-outlook";
import FactoryTrust from "@/components/sections/factories/factory-trust/factory-trust";
import FactoryOverview from "@/components/sections/factories/factory-overview/factory-overview";
import FactorySnapshot from "@/components/sections/factories/factory-snapshot/factory-snapshot";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import {
  conditionOf,
  provenanceDetail,
  provenanceOf,
  toLicence,
  licenceExpiryState,
  LICENCE_EXPIRY_SOON_DAYS,
  type FactoryRow,
  type ProvenanceStrings,
} from "@/features/factories/portfolio";
import type { PortfolioCounts } from "@/features/factories/portfolio-counts";
import { toDriverLines, type FactoryRiskMovement } from "@/features/factories/risk-context";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { formatDate } from "@/lib/dates";
import { fill, getMessages } from "@/i18n/messages";

export type RevampFactoryRow = FactoryRow;

const alertTone = (value: number | null, raised: StatusTone): StatusTone =>
  (value === null || value === 0 ? "neutral" : raised);

function planningHandoffHref(factory: FactoryRow): string {
  const query = new URLSearchParams({ factory: factory.id, source: "factory360" });
  if (factory.cr_number) query.set("cr", factory.cr_number);
  if (factory.license?.license_number) query.set("license", factory.license.license_number);
  if (factory.license?.plant_number) query.set("plant", factory.license.plant_number);
  return `/planning/single?${query.toString()}`;
}

export default function RevampFactory360Portfolio({ factories, portfolioLabel, canCreateInspection, locale, provenanceStrings, counts, riskMovement, now }: {
  factories: FactoryRow[];
  portfolioLabel: string;
  canCreateInspection: boolean;
  locale: "en" | "ar";
  provenanceStrings: ProvenanceStrings;
  counts: PortfolioCounts;
  riskMovement: ReadonlyMap<string, FactoryRiskMovement>;
  now: number;
}) {
  const { factories: copy } = getMessages(locale);
  const [selectedId, setSelectedId] = useState(factories[0]?.id ?? "");
  const selected = factories.find(factory => factory.id === selectedId) ?? factories[0];
  const highRisk = factories.filter(factory => factory.risk_band === "high").length;
  const licences = factories.map(factory => toLicence(factory, provenanceStrings, {
    openViolations: counts.openViolationsAvailable ? counts.openViolations.get(factory.id) ?? 0 : null,
    now,
  }));
  const sum = (values: ReadonlyMap<string, number>) =>
    factories.reduce((total, factory) => total + (values.get(factory.id) ?? 0), 0);
  const totalOpenViolations = sum(counts.openViolations);
  const totalActivePenalties = sum(counts.activePenalties);
  const provenanceNotice = factories
    .map(factory => provenanceOf(factory, provenanceStrings))
    .find(entry => entry.tone !== "success") ?? null;
  if (!selected) return null;

  const condition = conditionOf(selected.risk_band, {
    critical: copy.condition.critical,
    attention: copy.condition.attention,
    stable: copy.condition.stable,
    unavailable: copy.condition.unavailable,
  });
  const provenance = provenanceDetail(selected, provenanceStrings, locale);
  const createHref = canCreateInspection && !selected.is_temporary ? planningHandoffHref(selected) : null;
  const contextStrings = {
    selectedContext: copy.workspace.context,
    cr: copy.snapshot.commercialRegistration,
    licence: copy.hero.industrialLicence,
    plant: copy.portfolio.plantNumber,
    sourceStatus: provenanceStrings.sourceStatus,
    missing: copy.portfolio.missing,
  };
  const movement = riskMovement.get(selected.id) ?? null;
  const day = (iso: string | null) => (iso ? formatDate(iso, locale) : copy.portfolio.missing);
  const latestChange = movement === null
    ? copy.context.change.none
    : movement.previous === null
      ? copy.context.change.first
      : fill(copy.context.change.moved, {
        from: movement.previous.score,
        to: movement.latest.score,
        date: day(movement.latest.calculatedAt),
      });
  const sources = [
    {
      key: "senaei",
      label: copy.context.sources.senaei,
      state: selected.source_synced_at ? copy.context.sources.synced : copy.context.sources.notSynced,
      tone: selected.source_synced_at ? ("success" as StatusTone) : ("neutral" as StatusTone),
    },
    {
      key: "riskEngine",
      label: copy.context.sources.riskEngine,
      state: movement ? copy.context.sources.calculated : copy.context.sources.notCalculated,
      tone: movement ? ("success" as StatusTone) : ("neutral" as StatusTone),
    },
  ];
  const sections = [
    { key: "inspectionHistory", ...copy.sections.items.inspectionHistory },
    { key: "violations", ...copy.sections.items.violations },
    { key: "industrial", ...copy.sections.items.industrial },
    { key: "documents", ...copy.sections.items.documents },
  ].map(item => ({
    key: item.key,
    title: item.title,
    body: item.body,
    openLabel: fill(copy.sections.open, { title: item.title }),
    href: selected.dossier_href,
  }));
  const overviewStrings = {
    opened: copy.hero.opened,
    plannerNote: copy.hero.plannerNote,
    plantNumber: copy.portfolio.plantNumber,
    licenceType: copy.hero.licenceType,
    stage: copy.hero.stage,
    licenceState: copy.snapshot.licenceState,
    createInspection: copy.action.createInspection,
    viewOnMap: copy.action.viewOnMap,
    openProfile: copy.action.openProfile,
    missing: copy.portfolio.missing,
    sectionAvailable: copy.sections.availableInProfile,
  };
  const openViolations = counts.openViolationsAvailable ? counts.openViolations.get(selected.id) ?? 0 : null;
  const activePenalties = counts.activePenaltiesAvailable ? counts.activePenalties.get(selected.id) ?? 0 : null;
  const products = counts.productsAvailable ? counts.products.get(selected.id) ?? 0 : null;
  const inspectedAt = counts.lastInspection.get(selected.id) ?? null;
  const daysSinceInspection = inspectedAt === null
    ? null
    : Math.floor((now - new Date(inspectedAt).getTime()) / 86_400_000);
  const expiryState = licenceExpiryState(selected.license?.expiry_date ?? null, now);
  const conditionReasons = [
    openViolations !== null && openViolations > 0
      ? fill(copy.reason.openViolations, { n: openViolations }) : null,
    daysSinceInspection === null
      ? copy.reason.neverInspected
      : fill(copy.reason.inspectedDaysAgo, { n: daysSinceInspection }),
    expiryState === "expired" ? copy.reason.licenceExpired : null,
    expiryState === "expiringSoon"
      ? fill(copy.reason.licenceExpiring, { n: LICENCE_EXPIRY_SOON_DAYS }) : null,
  ].filter((reason): reason is string => reason !== null);
  const numberMetric = (key: string, label: string, value: number | null, tone: StatusTone) => ({
    key,
    label,
    value: value === null ? copy.snapshot.notAvailable : String(value),
    tone: value === null ? ("neutral" as StatusTone) : tone,
    kind: (value === null ? "text" : "number") as "number" | "text",
  });
  const metrics = [
    numberMetric("riskScore", copy.snapshot.riskScore, selected.risk_score, condition.tone),
    {
      key: "latestInspection",
      label: copy.snapshot.latestInspection,
      value: inspectedAt === null ? copy.snapshot.never : day(inspectedAt),
      tone: "neutral" as StatusTone,
      kind: "text" as const,
    },
    numberMetric("openViolations", copy.snapshot.openViolations, openViolations, alertTone(openViolations, "danger")),
    numberMetric("activePenalties", copy.snapshot.activePenalties, activePenalties, alertTone(activePenalties, "warning")),
    numberMetric("employees", copy.snapshot.employees, selected.employees_total, "neutral"),
    numberMetric("products", copy.snapshot.products, products, "neutral"),
  ];

  return (
    <FactoryWorkspace
      startLabel={copy.workspace.portfolio}
      endLabel={copy.workspace.context}
      start={
        <FactoriesPortfolio
          portfolioLabel={portfolioLabel}
          licences={licences}
          selectedId={selected.id}
          onSelect={setSelectedId}
          stats={[
            { key: "factories", label: copy.portfolio.factories, value: factories.length, tone: "neutral" },
            { key: "highRisk", label: copy.portfolio.highRisk, value: highRisk, tone: alertTone(highRisk, "danger") },
            {
              key: "openViolations",
              label: copy.portfolio.openViolations,
              value: counts.openViolationsAvailable ? totalOpenViolations : null,
              tone: alertTone(counts.openViolationsAvailable ? totalOpenViolations : null, "danger"),
            },
            {
              key: "activePenalties",
              label: copy.portfolio.activePenalties,
              value: counts.activePenaltiesAvailable ? totalActivePenalties : null,
              tone: alertTone(counts.activePenaltiesAvailable ? totalActivePenalties : null, "warning"),
            },
          ]}
          provenanceNotice={provenanceNotice}
          formatDate={iso => formatDate(iso, locale)}
          strings={{
            portfolio: copy.portfolio.portfolio,
            factories: copy.portfolio.factories,
            highRisk: copy.portfolio.highRisk,
            openViolations: copy.portfolio.openViolations,
            activePenalties: copy.portfolio.activePenalties,
            licenceNumber: copy.portfolio.licenceNumber,
            plantNumber: copy.portfolio.plantNumber,
            type: copy.portfolio.type,
            stage: copy.portfolio.stage,
            expiry: copy.portfolio.expiry,
            notAvailable: copy.portfolio.notAvailable,
            missing: copy.portfolio.missing,
            riskHigh: copy.risk.high,
            riskMedium: copy.risk.medium,
            riskLow: copy.risk.low,
            expired: copy.portfolio.expired,
            expiringSoon: copy.portfolio.expiringSoon,
          }}
        />
      }
      end={
        <FactoryContext
          factory={selected}
          provenance={provenance}
          strings={contextStrings}
          outlook={
            <FactoryRiskOutlook
              score={selected.risk_score === null ? copy.portfolio.missing : String(selected.risk_score)}
              band={selected.risk_band ? { label: condition.label, tone: condition.tone } : null}
              noScoreLabel={copy.context.outlook.noScore}
              modelVersion={selected.risk_version ?? copy.portfolio.missing}
              drivers={toDriverLines(selected.risk_drivers, copy.portfolio.missing)}
              latestChange={latestChange}
              actionHref={selected.dossier_href}
              strings={copy.context.outlook}
            />
          }
          trust={
            <FactoryTrust
              lastSynchronised={selected.source_synced_at ? day(selected.source_synced_at) : provenanceStrings.freshnessUnavailable}
              sources={sources}
              strings={copy.context.trust}
            />
          }
          advisory={
            <FactoryAiAdvisory
              factoryId={selected.id}
              locale={locale}
              strings={{
                title: copy.context.advisory.title,
                advisory: copy.context.advisory.advisory,
                evidence: copy.context.advisory.evidence,
                idle: copy.context.advisory.idle,
                generate: copy.context.advisory.generate,
                generating: copy.context.advisory.generating,
                confidenceUnavailable: copy.context.advisory.confidenceUnavailable,
              }}
            />
          }
        />
      }
    >
      <FactoryOverview
        factory={selected}
        sections={sections}
        snapshot={
          <FactorySnapshot
            condition={condition}
            reasons={conditionReasons}
            metrics={metrics}
            strings={{
              title: copy.snapshot.title,
              overallCondition: copy.snapshot.overallCondition,
              noReasons: copy.snapshot.noReasons,
            }}
          />
        }
        createHref={createHref}
        mapHref={`/operations?region=${encodeURIComponent(selected.region ?? "")}`}
        profileHref={selected.dossier_href}
        strings={overviewStrings}
      />
    </FactoryWorkspace>
  );
}
