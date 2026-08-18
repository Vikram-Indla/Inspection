"use client";
import { formatCount } from "@/i18n/numbers";

import { useState } from "react";
import FactoriesPortfolio from "@/components/sections/factories/factories-portfolio/factories-portfolio";
import FactoryAiAdvisory from "@/components/sections/factories/factory-ai-advisory/factory-ai-advisory";
import FactoryCompliance from "@/components/sections/factories/factory-compliance/factory-compliance";
import FactoryContext from "@/components/sections/factories/factory-context/factory-context";
import FactoryRiskOutlook from "@/components/sections/factories/factory-risk-outlook/factory-risk-outlook";
import FactoryTrust from "@/components/sections/factories/factory-trust/factory-trust";
import FactoryOverview from "@/components/sections/factories/factory-overview/factory-overview";
import FactoryProfile from "@/components/sections/factories/factory-profile/factory-profile";
import FactorySections from "@/components/sections/factories/factory-sections/factory-sections";
import FactoryTrends from "@/components/sections/factories/factory-trends/factory-trends";
import FactorySnapshot from "@/components/sections/factories/factory-snapshot/factory-snapshot";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import {
  provenanceDetail,
  provenanceOf,
  toLicence,
  type FactoryRow,
  type ProvenanceStrings,
} from "@/features/factories/portfolio";
import { buildFactoryView } from "@/features/factories/view";
import type { PortfolioCounts } from "@/features/factories/portfolio-counts";
import type { FactoryCompliance as FactoryComplianceData } from "@/features/factories/compliance";
import type { FactoryProfileRecord } from "@/features/factories/profile";
import { toDriverLines, type FactoryRiskMovement } from "@/features/factories/risk-context";
import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";
import { formatDate } from "@/lib/dates";
import { getMessages } from "@/i18n/messages";

const alertTone = (value: number | null, raised: StatusTone): StatusTone =>
  (value === null || value === 0 ? "neutral" : raised);

function planningHandoffHref(factory: FactoryRow): string {
  const query = new URLSearchParams({ factory: factory.id, source: "factory360" });
  if (factory.cr_number) query.set("cr", factory.cr_number);
  if (factory.license?.license_number) query.set("license", factory.license.license_number);
  if (factory.license?.plant_number) query.set("plant", factory.license.plant_number);
  return `/planning/single?${query.toString()}`;
}

export default function Factory360Portfolio({ factories, portfolioLabel, canCreateInspection, locale, provenanceStrings, counts, complianceByFactory, penaltiesReadable, profiles, riskMovement, now }: {
  factories: FactoryRow[];
  portfolioLabel: string;
  canCreateInspection: boolean;
  locale: "en" | "ar";
  provenanceStrings: ProvenanceStrings;
  counts: PortfolioCounts;
  complianceByFactory: ReadonlyMap<string, FactoryComplianceData>;
  penaltiesReadable: boolean;
  profiles: ReadonlyMap<string, FactoryProfileRecord>;
  riskMovement: ReadonlyMap<string, FactoryRiskMovement>;
  now: number;
}) {
  const { factories: copy } = getMessages(locale);
  const [selectedId, setSelectedId] = useState(factories[0]?.id ?? "");
  const selected = factories.find(factory => factory.id === selectedId) ?? factories[0];
  const highRisk = factories.filter(factory => factory.risk_band === "high").length;
  const licences = factories.map(factory => toLicence(factory, provenanceStrings, locale, {
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

  const view = buildFactoryView({
    factory: selected,
    locale,
    counts,
    movement: riskMovement.get(selected.id) ?? null,
    compliance: complianceByFactory.get(selected.id),
    profile: profiles.get(selected.id),
    now,
    freshnessUnavailable: provenanceStrings.freshnessUnavailable,
    sourceStatus: provenanceStrings.sourceStatus,
  });
  const provenance = provenanceDetail(selected, provenanceStrings, locale);
  const createHref = canCreateInspection && !selected.is_temporary ? planningHandoffHref(selected) : null;

  return (
    <FactoryWorkspace
      startLabel={copy.workspace.portfolio}
      endLabel={copy.workspace.context}
      top={
        <FactoryAiAdvisory
          factoryId={selected.id}
          locale={locale}
          strings={view.strings.advisory}
        />
      }
      start={
        <FactoriesPortfolio
          portfolioLabel={portfolioLabel}
          licences={licences}
          selectedId={selected.id}
          onSelect={setSelectedId}
          stats={[
            { key: "factories", label: copy.portfolio.factories, value: formatCount(factories.length, locale), tone: "neutral" },
            { key: "highRisk", label: copy.portfolio.highRisk, value: formatCount(highRisk, locale), tone: alertTone(highRisk, "danger") },
            {
              key: "openViolations",
              label: copy.portfolio.openViolations,
              value: counts.openViolationsAvailable ? formatCount(totalOpenViolations, locale) : null,
              tone: alertTone(counts.openViolationsAvailable ? totalOpenViolations : null, "danger"),
            },
            {
              key: "activePenalties",
              label: copy.portfolio.activePenalties,
              value: counts.activePenaltiesAvailable ? formatCount(totalActivePenalties, locale) : null,
              tone: alertTone(counts.activePenaltiesAvailable ? totalActivePenalties : null, "warning"),
            },
          ]}
          provenanceNotice={provenanceNotice}
          formatDate={iso => formatDate(iso, locale)}
          strings={view.strings.portfolio}
        />
      }
      end={
        <FactoryContext
          outlook={
            <FactoryRiskOutlook
              modelVersion={selected.risk_version ?? copy.portfolio.missing}
              drivers={toDriverLines(selected.risk_drivers, copy.portfolio.missing)}
              latestChange={view.latestChange}
              strings={copy.context.outlook}
            />
          }
          trust={
            <FactoryTrust
              lastSynchronised={view.lastSynchronised}
              sources={view.sources}
              provenance={provenance}
              strings={copy.context.trust}
            />
          }
        />
      }
    >
      <FactoryOverview
        factory={selected}
        snapshot={
          <FactorySnapshot
            condition={view.condition}
            reasons={view.conditionReasons}
            metrics={view.metrics}
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
        strings={view.strings.overview}
      />

      <FactoryCompliance
        reports={view.compliance.reports}
        violations={view.compliance.violations}
        penalties={view.compliance.penalties}
        penaltiesReadable={penaltiesReadable}
        trends={
          <FactoryTrends
            series={view.trendSeries}
            current={view.riskCurrent}
            delta={view.riskDelta}
            tone={view.riskTone}
            strings={copy.trends}
          />
        }
        strings={copy.compliance}
      />

      <FactoryProfile
        groups={view.profileGroups}
        official={profiles.get(selected.id)?.media.official ?? 0}
        inspection={profiles.get(selected.id)?.media.inspection ?? 0}
        href={selected.dossier_href}
        locale={locale}
        strings={copy.profile}
      />

      <FactorySections sections={view.sections} availableLabel={copy.sections.availableInProfile} />
    </FactoryWorkspace>
  );
}
